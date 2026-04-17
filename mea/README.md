# IRS — Image Retrieval System

Upload a product image → get a fully written Amazon-style product listing powered by **CLIP + FAISS + Gemini AI**.

---

## Architecture

```
User uploads image (JPG / PNG / WebP)
        │
        ▼
 CLIP ViT-B/32  →  512-dim L2-normalized image embedding
        │
        ▼
 FAISS IndexFlatIP  →  Top-K cosine similarity search over product catalog
        │
        ▼
 Claude API (claude-sonnet-4-6)
 ├── Vision : describe the uploaded image
 └── Text   : generate title · bullets · description · keywords
        │
        ▼
 Amazon-style product page rendered in React + Tailwind CSS
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Image Embeddings | CLIP ViT-B/32 (HuggingFace Transformers) |
| Vector Search | FAISS (Facebook, CPU) |
| AI (Vision + Text) | Google Gemini API — `gemini-2.0-flash` |
| Backend | FastAPI + Uvicorn |
| Frontend | React 19 + Vite + Tailwind CSS |
| Dataset | 50-product sample (extendable to 50 K+) |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- An **Anthropic API key** (only external credential needed)

---

## Step 1 — Get your Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com) → **Get API Key**
2. Create a new key and copy it (it's free to start)

---

## Step 2 — Configure environment variables

```bash
cd mea
cp .env.example .env
```

Open `.env` and fill in your key:

```env
GEMINI_API_KEY=AIzaSy-xxxxxxxxxxxxxxxx
BACKEND_URL=http://localhost:8000
```

> `BACKEND_URL` is only used if you deploy the backend remotely. Leave it as-is for local development.

---

## Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

---

## Step 4 — Build the FAISS index

This embeds the 50 sample products using CLIP text encodings and saves to `data/faiss.index`. Run it **once** before starting the backend.

```bash
python scripts/build_index.py
```

---

## Step 5 — Start the backend

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

---

## Step 6 — Start the frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

> **Optional:** If your backend runs on a different host/port, create `frontend/.env`:
> ```env
> VITE_API_URL=http://your-backend-host:8000
> ```
> If not set, it defaults to `http://localhost:8000`.

---

## Usage

1. Open `http://localhost:5173` in your browser
2. Drag & drop (or click to browse) a product image — JPG, PNG, or WebP, max 10 MB
3. Adjust the **Top-K** slider (how many similar products to retrieve)
4. Click **Generate Product Page**
5. Get back: product title, bullet features, full description, SEO keywords, and similar products sidebar

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/generate` | Upload image → product page JSON |
| `GET` | `/api/health` | Health check + FAISS index stats |
| `POST` | `/api/rebuild-index` | Rebuild FAISS index from sample data |

### Example with curl

```bash
curl -X POST http://localhost:8000/api/generate \
  -F "file=@product.jpg" \
  -F "top_k=5"
```

---

## Extending the Dataset

Replace `data/sample_products.json` with a larger catalog (e.g. Amazon Berkeley Objects) and re-run:

```bash
python scripts/build_index.py
```

Each product entry format:

```json
{
  "product_id": "P001",
  "title": "Product Title",
  "category": "Category Name",
  "description": "Product description text..."
}
```

---

## How the Retrieval Works

1. **Indexing:** Products embedded via CLIP text encoder (`title + category + description`) → stored in FAISS `IndexFlatIP`
2. **Query:** Uploaded image → CLIP image encoder → 512-dim vector
3. **Search:** FAISS inner-product search on L2-normalized vectors = cosine similarity → top-K results
4. **Generation:** Top-K results + Claude vision description → Claude generates the full listing
