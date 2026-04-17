# IRS — Image Retrieval System: Amazon-Style Product Page Generator

Upload a product image → get a fully written Amazon-style product listing powered by CLIP + FAISS + Claude API.

## Architecture

```
User uploads image (JPG/PNG)
        │
        ▼
 CLIP ViT-B/32 (openai/clip-vit-base-patch32)
 → L2-normalized 512-dim image embedding
        │
        ▼
 FAISS IndexFlatIP
 → Top-K cosine similarity search over pre-indexed product catalog
        │
        ▼
 Claude API (claude-sonnet-4-6)
 ├── Vision: describe uploaded image
 └── Text: generate title, bullets, description, keywords
        │
        ▼
 Amazon-style product page (JSON + HTML)
```

## Tech Stack

| Layer | Tool |
|---|---|
| Image Embeddings | CLIP ViT-B/32 (HuggingFace Transformers) |
| Vector Search | FAISS (Facebook, CPU) |
| Text & Vision AI | Claude API (claude-sonnet-4-6) |
| Backend | FastAPI + Uvicorn |
| Frontend | Streamlit |
| Dataset | 50-product sample (extendable to 50K+) |

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set your Anthropic API key
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Build the FAISS index
```bash
python scripts/build_index.py
```
This embeds 50 sample products using CLIP text embeddings and saves to `data/faiss.index`.

### 4. Start the backend
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Start the frontend (new terminal)
```bash
streamlit run frontend/app.py --server.port 8501
```

Then open: `http://localhost:8501`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/generate` | Upload image → product page |
| `GET` | `/api/health` | Health check + index stats |
| `POST` | `/api/rebuild-index` | Rebuild FAISS index from sample data |

### Example with curl
```bash
curl -X POST http://localhost:8000/api/generate \
  -F "file=@product.jpg" \
  -F "top_k=5"
```

## How the IR Part Works

1. **Indexing Phase:** Products are embedded using CLIP text encoder (`title + category + description`) → stored in FAISS IndexFlatIP
2. **Query Phase:** User image → CLIP image encoder → 512-dim vector
3. **Retrieval:** FAISS inner product search (cosine similarity on L2-normalized vectors) → top-K products
4. **Re-ranking:** Results ranked by cosine similarity score
5. **Evaluation Metrics:** Precision@K, Recall@K, MRR (Mean Reciprocal Rank)

## Extending the Dataset

Replace `data/sample_products.json` with a larger product catalog (Amazon Berkeley Objects, etc.) and run `python scripts/build_index.py` to re-index.

Each product entry format:
```json
{
  "product_id": "P001",
  "title": "Product Title",
  "category": "Category Name",
  "description": "Product description text..."
}
```
