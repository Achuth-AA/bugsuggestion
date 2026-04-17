"""
FastAPI backend for the IRS (Image Retrieval System) project.
Endpoints:
  POST /api/generate  — Upload image → returns Amazon-style product page
  GET  /api/health    — Health + index stats
  POST /api/rebuild   — Rebuild FAISS index from sample data
"""

import base64
import io
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

load_dotenv()

from backend.embedder import get_embedder
from backend.generator import describe_image_with_claude, generate_product_page
from backend.models import HealthResponse, ProductPage
from backend.retriever import get_retriever

app = FastAPI(
    title="IRS — Image Retrieval System",
    description="Upload a product image → get an Amazon-style product page.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # Eagerly load models so first request isn't slow
    get_embedder()
    get_retriever()


@app.get("/api/health", response_model=HealthResponse)
def health():
    retriever = get_retriever()
    embedder_loaded = True
    try:
        get_embedder()
    except Exception:
        embedder_loaded = False
    return HealthResponse(
        status="ok",
        index_size=retriever.size,
        model_loaded=embedder_loaded,
    )


@app.post("/api/generate", response_model=ProductPage)
async def generate(file: UploadFile = File(...), top_k: int = 5):
    """
    Upload a product image and receive a full Amazon-style product page.
    """
    # --- Validate file type ---
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are supported.")

    raw_bytes = await file.read()
    if len(raw_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(400, "Image must be under 10 MB.")

    # --- Load image ---
    try:
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Could not decode image: {e}")

    # --- CLIP embedding + FAISS retrieval ---
    embedder = get_embedder()
    retriever = get_retriever()

    query_vec = embedder.embed_image(image)
    retrieved = retriever.search(query_vec, top_k=top_k)

    # --- Claude vision: describe the image ---
    b64 = base64.b64encode(raw_bytes).decode("utf-8")
    try:
        image_description = describe_image_with_claude(b64)
    except Exception as e:
        # Fallback if vision call fails (e.g., no API key set yet)
        image_description = "a product"
        print(f"[WARN] Vision description failed: {e}")

    # --- Claude text: generate product page ---
    try:
        product_page = generate_product_page(image_description, retrieved)
    except Exception as e:
        raise HTTPException(500, f"Content generation failed: {e}")

    return product_page


@app.post("/api/rebuild-index")
def rebuild_index():
    """Rebuild the FAISS index from data/sample_products.json."""
    sample_path = Path("data/sample_products.json")
    if not sample_path.exists():
        raise HTTPException(404, "data/sample_products.json not found. Run scripts/generate_sample_data.py first.")

    import json
    with open(sample_path) as f:
        products = json.load(f)

    embedder = get_embedder()
    retriever = get_retriever()

    import numpy as np
    embeddings = []
    valid_products = []
    for p in products:
        text = f"{p['title']} {p['category']} {p['description']}"
        vec = embedder.embed_text(text)
        embeddings.append(vec)
        valid_products.append(p)

    embeddings_arr = np.vstack(embeddings).astype("float32")
    retriever.build(embeddings_arr, valid_products)
    return {"status": "ok", "indexed": len(valid_products)}
