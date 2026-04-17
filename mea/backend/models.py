from pydantic import BaseModel
from typing import List, Optional


class ProductFeature(BaseModel):
    title: str
    description: str


class RetrievedProduct(BaseModel):
    product_id: str
    title: str
    category: str
    description: str
    similarity_score: float


class ProductPage(BaseModel):
    title: str
    category: str
    bullet_features: List[str]
    detailed_description: str
    keywords: List[str]
    retrieved_references: List[RetrievedProduct]


class GenerateRequest(BaseModel):
    top_k: int = 5


class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    status: str
    index_size: int
    model_loaded: bool
