"""
Build the FAISS index from sample_products.json.
Run from project root: python scripts/build_index.py
"""

import json
import sys
from pathlib import Path

# Allow imports from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
from tqdm import tqdm

from backend.embedder import CLIPEmbedder
from backend.retriever import FAISSRetriever


def main():
    sample_path = Path("data/sample_products.json")
    if not sample_path.exists():
        print(f"ERROR: {sample_path} not found.")
        sys.exit(1)

    with open(sample_path) as f:
        products = json.load(f)

    print(f"Loaded {len(products)} products.")
    print("Loading CLIP model...")
    embedder = CLIPEmbedder()

    embeddings = []
    print("Generating text embeddings for all products...")
    for p in tqdm(products, desc="Embedding"):
        text = f"{p['title']} {p['category']} {p['description']}"
        vec = embedder.embed_text(text)
        embeddings.append(vec)

    embeddings_arr = np.vstack(embeddings).astype("float32")
    print(f"Embeddings shape: {embeddings_arr.shape}")

    retriever = FAISSRetriever.__new__(FAISSRetriever)
    retriever.index = None
    retriever.products = []
    retriever.build(embeddings_arr, products)
    print("Done! Index saved to data/faiss.index")
    print(f"Total indexed: {retriever.size} products")


if __name__ == "__main__":
    main()
