"""
FAISS-based vector retrieval engine.
Supports both dense (CLIP) and hybrid retrieval.
"""

import json
import os
from pathlib import Path
from typing import List, Tuple

import faiss
import numpy as np

from backend.models import RetrievedProduct

INDEX_PATH = Path("data/faiss.index")
META_PATH = Path("data/products_meta.json")


class FAISSRetriever:
    def __init__(self):
        self.index: faiss.IndexFlatIP | None = None  # Inner product on L2-normed vecs == cosine
        self.products: List[dict] = []
        self._load()

    def _load(self):
        if INDEX_PATH.exists() and META_PATH.exists():
            print("[FAISSRetriever] Loading existing index...")
            self.index = faiss.read_index(str(INDEX_PATH))
            with open(META_PATH, "r") as f:
                self.products = json.load(f)
            print(f"[FAISSRetriever] Loaded {self.index.ntotal} vectors.")
        else:
            print("[FAISSRetriever] No index found. Run build_index.py first.")

    def build(self, embeddings: np.ndarray, products: List[dict]):
        """Build a new FAISS index from embeddings and product metadata."""
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings.astype(np.float32))
        self.products = products
        INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(INDEX_PATH))
        with open(META_PATH, "w") as f:
            json.dump(products, f, indent=2)
        print(f"[FAISSRetriever] Built index with {self.index.ntotal} vectors.")

    def search(self, query_vec: np.ndarray, top_k: int = 5) -> List[RetrievedProduct]:
        """Return top-K most similar products for a query embedding."""
        if self.index is None or self.index.ntotal == 0:
            return []
        query = query_vec.reshape(1, -1).astype(np.float32)
        scores, indices = self.index.search(query, top_k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            p = self.products[idx]
            results.append(
                RetrievedProduct(
                    product_id=p.get("product_id", str(idx)),
                    title=p.get("title", ""),
                    category=p.get("category", ""),
                    description=p.get("description", ""),
                    similarity_score=float(score),
                )
            )
        return results

    @property
    def size(self) -> int:
        return self.index.ntotal if self.index else 0


_retriever_instance = None


def get_retriever() -> FAISSRetriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = FAISSRetriever()
    return _retriever_instance
