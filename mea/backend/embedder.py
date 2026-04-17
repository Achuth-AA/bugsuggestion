"""
CLIP-based image and text embedding module.
Uses openai/clip-vit-base-patch32 for cross-modal embeddings.
"""

import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

_embedder_instance = None


class CLIPEmbedder:
    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[CLIPEmbedder] Loading {model_name} on {self.device}...")
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.model.eval()
        self.embed_dim = 512  # CLIP ViT-B/32 output dim
        print("[CLIPEmbedder] Model loaded.")

    def embed_image(self, image: Image.Image) -> np.ndarray:
        """Return L2-normalized CLIP image embedding as float32 array."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            features = self.model.get_image_features(**inputs)
        vec = features.cpu().numpy().astype(np.float32).flatten()
        vec /= np.linalg.norm(vec) + 1e-8
        return vec

    def embed_text(self, text: str) -> np.ndarray:
        """Return L2-normalized CLIP text embedding as float32 array."""
        inputs = self.processor(
            text=[text], return_tensors="pt", padding=True, truncation=True
        ).to(self.device)
        with torch.no_grad():
            features = self.model.get_text_features(**inputs)
        vec = features.cpu().numpy().astype(np.float32).flatten()
        vec /= np.linalg.norm(vec) + 1e-8
        return vec


def get_embedder() -> CLIPEmbedder:
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = CLIPEmbedder()
    return _embedder_instance
