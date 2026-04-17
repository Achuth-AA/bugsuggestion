"""
FastAPI backend for the IRS (Image Retrieval System) project.
Endpoints:
  POST /api/generate      — Upload image → returns Amazon-style product page
  GET  /api/health        — Health + index stats
  POST /api/rebuild-index — Rebuild FAISS index from sample data
"""

import io
import json
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

load_dotenv()

from backend.embedder import get_embedder
from backend.generator import describe_image_with_gemini, generate_product_page
from backend.models import HealthResponse, ProductPage
from backend.retriever import get_retriever


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly load models so the first request isn't slow
    get_embedder()
    get_retriever()
    yield


app = FastAPI(
    title="IRS — Image Retrieval System",
    description="Upload a product image → get an Amazon-style product page.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    """Upload a product image and receive a full Amazon-style product page."""
    ALLOWED = {"image/jpeg", "image/png", "image/webp"}
    content_type = file.content_type
    if content_type not in ALLOWED:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are supported.")

    raw_bytes = await file.read()
    if len(raw_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 10 MB.")

    try:
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Could not decode image: {e}")

    embedder = get_embedder()
    retriever = get_retriever()

    query_vec = embedder.embed_image(image)
    retrieved = retriever.search(query_vec, top_k=top_k)

    try:
        image_description = describe_image_with_gemini(image)
    except Exception as e:
        image_description = "a product"
        print(f"[WARN] Vision description failed: {e}")

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
        raise HTTPException(404, "data/sample_products.json not found. Run scripts/build_index.py first.")

    with open(sample_path) as f:
        products = json.load(f)

    embedder = get_embedder()
    retriever = get_retriever()

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
