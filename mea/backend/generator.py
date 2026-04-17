"""
Content generation using Google Gemini API.
Produces Amazon-style product pages from retrieved product context.
"""

import io
import json
import os
import re
from typing import List

import google.generativeai as genai
from PIL import Image

from backend.models import ProductPage, RetrievedProduct

_model = None


def get_model() -> genai.GenerativeModel:
    global _model
    if _model is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-2.0-flash")
    return _model


def _extract_json(text: str) -> dict:
    """Strip markdown fences and parse JSON from Gemini's response."""
    cleaned = re.sub(r"^```[a-z]*\n?", "", text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\n?```$", "", cleaned.strip())
    return json.loads(cleaned.strip())


def describe_image_with_gemini(image: Image.Image) -> str:
    """
    Use Gemini vision to get a brief description of the uploaded product image.
    Accepts a PIL Image directly.
    """
    model = get_model()
    response = model.generate_content([
        image,
        "Describe this product image in 1-2 concise sentences suitable for an e-commerce listing. "
        "Focus on the object, its color, material, and key visual features.",
    ])
    return response.text.strip()


def generate_product_page(
    image_description: str,
    retrieved: List[RetrievedProduct],
) -> ProductPage:
    """Use Gemini to generate an Amazon-style product page."""
    model = get_model()

    context_lines = []
    for i, p in enumerate(retrieved, 1):
        context_lines.append(
            f"{i}. [{p.category}] {p.title}\n   {p.description[:200]}"
        )
    context_block = "\n".join(context_lines) if context_lines else "No similar products found."

    prompt = f"""You are an expert Amazon product listing copywriter.

A seller has uploaded a product image. Visual analysis suggests: "{image_description}"

Here are {len(retrieved)} similar products retrieved from our database:
{context_block}

Based on the visual content and these references, generate a complete Amazon-style product listing. Return a JSON object with EXACTLY this structure (no extra text, valid JSON only):

{{
  "title": "concise product title under 200 chars",
  "category": "main product category",
  "bullet_features": [
    "Feature 1: key benefit",
    "Feature 2: key benefit",
    "Feature 3: key benefit",
    "Feature 4: key benefit",
    "Feature 5: key benefit"
  ],
  "detailed_description": "2-3 paragraph detailed product description for the listing",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}}

Guidelines:
- Title: Capitalize important words, include brand-style prefix if applicable
- Bullet features: Start with bold keyword phrase, then explain the benefit
- Description: Engaging, customer-focused, highlight use cases
- Keywords: Mix broad and specific SEO terms relevant to the product"""

    response = model.generate_content(prompt)
    data = _extract_json(response.text.strip())

    return ProductPage(
        title=data["title"],
        category=data["category"],
        bullet_features=data["bullet_features"],
        detailed_description=data["detailed_description"],
        keywords=data["keywords"],
        retrieved_references=retrieved,
    )
