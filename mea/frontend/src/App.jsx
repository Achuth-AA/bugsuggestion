import { useState, useRef } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function UploadZone({ onFile, preview }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-colors min-h-56
        ${dragging ? 'border-violet-500 bg-violet-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      {preview ? (
        <img src={preview} alt="preview" className="max-h-52 rounded-xl object-contain" />
      ) : (
        <>
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm text-gray-500">Drag & drop or <span className="text-violet-600 font-medium">browse</span></p>
          <p className="text-xs text-gray-400">JPG, PNG, WebP · max 10 MB</p>
        </>
      )}
    </div>
  )
}

function Badge({ text }) {
  return (
    <span className="inline-block bg-violet-100 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {text}
    </span>
  )
}

function StarRating({ score }) {
  const pct = Math.round(score * 5 * 10) / 10
  const full = Math.floor(pct)
  return (
    <span className="flex items-center gap-1 text-amber-400 text-sm">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < full ? 'fill-current' : 'fill-gray-200'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-gray-500 ml-1">{pct.toFixed(1)}</span>
    </span>
  )
}

function ProductCard({ product }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-400 font-bold text-sm">
        {product.category.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{product.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
        <StarRating score={product.similarity_score} />
      </div>
    </div>
  )
}

function ProductPage({ data }) {
  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main listing */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Badge text={data.category} />
          <h2 className="mt-3 text-2xl font-semibold text-gray-900 leading-snug">{data.title}</h2>

          {/* Bullet features */}
          <ul className="mt-5 space-y-2">
            {data.bullet_features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Product Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{data.detailed_description}</p>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">SEO Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((kw, i) => (
              <span key={i} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">{kw}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Similar products sidebar */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Similar Products Found</h3>
          <div className="space-y-3">
            {data.retrieved_references.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [topK, setTopK] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleFile(f) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await axios.post(`${API_BASE}/api/generate?top_k=${topK}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Navbar */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-semibold text-gray-800">IRS</span>
            <span className="text-gray-400 text-sm hidden sm:block">Image Retrieval System</span>
          </div>
          {result && (
            <button onClick={reset} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
              ← New Search
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        {!result && (
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Product Image → Amazon Listing
            </h1>
            <p className="mt-3 text-gray-500 text-lg">
              Upload any product photo and get a complete, SEO-ready listing powered by CLIP + Claude AI.
            </p>
          </div>
        )}

        {/* Upload form */}
        {!result && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl mx-auto space-y-5">
            <UploadZone onFile={handleFile} preview={preview} />

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">Similar products (top-K):</label>
              <input
                type="range" min={1} max={10} value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="flex-1 accent-violet-600"
              />
              <span className="text-sm font-medium text-gray-700 w-4 text-right">{topK}</span>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating listing…
                </>
              ) : 'Generate Product Page'}
            </button>
          </form>
        )}

        {/* Result */}
        {result && (
          <div>
            <div className="flex items-center gap-4 mb-2">
              {preview && (
                <img src={preview} alt="uploaded" className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm" />
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Generated listing</p>
                <h2 className="text-lg font-semibold text-gray-800 leading-tight">{result.title}</h2>
              </div>
            </div>
            <ProductPage data={result} />
          </div>
        )}
      </main>
    </div>
  )
}
