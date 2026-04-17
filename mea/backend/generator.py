"""
Content generation using Claude API.
Produces Amazon-style product pages from retrieved product context.
"""

import os
from typing import List

import anthropic

from backend.models import ProductPage, RetrievedProduct

_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set.")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def generate_product_page(
    image_description: str,
    retrieved: List[RetrievedProduct],
) -> ProductPage:
    """
    Use Claude to generate an Amazon-style product page.

    Args:
        image_description: Short visual description of the uploaded image.
        retrieved: Top-K similar products from FAISS retrieval.
    """
    client = get_client()

    # Build context from retrieved products
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

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    import json
    data = json.loads(raw)

    return ProductPage(
        title=data["title"],
        category=data["category"],
        bullet_features=data["bullet_features"],
        detailed_description=data["detailed_description"],
        keywords=data["keywords"],
        retrieved_references=retrieved,
    )


def describe_image_with_claude(image_b64: str) -> str:
    """
    Use Claude's vision to get a brief description of the uploaded product image.
    This description is then used as part of the generation prompt.
    """
    client = get_client()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Describe this product image in 1-2 concise sentences suitable for an e-commerce listing. Focus on the object, its color, material, and key visual features.",
                    },
                ],
            }
        ],
    )
    return message.content[0].text.strip()
