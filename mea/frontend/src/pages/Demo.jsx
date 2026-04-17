import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* ── Upload Zone ── */
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
    <motion.div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      animate={{ borderColor: dragging ? '#7c3aed' : '#374151' }}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-colors min-h-56 overflow-hidden
        ${dragging ? 'bg-violet-500/5' : 'bg-gray-900/50 hover:bg-gray-800/50'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.img
            key="preview"
            src={preview}
            alt="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="max-h-52 rounded-xl object-contain"
          />
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 p-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              Drag & drop or <span className="text-violet-400 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-600">JPG · PNG · WebP · max 10 MB</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Loading skeleton ── */
function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-lg bg-gray-800 ${className}`} />
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-6 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <div className="space-y-2 pt-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-2xl border border-white/5 p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    </motion.div>
  )
}

/* ── Product result ── */
function StarRating({ score }) {
  const filled = Math.round(score * 5)
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < filled ? 'text-amber-400 fill-current' : 'text-gray-700 fill-current'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{(score * 5).toFixed(1)}</span>
    </span>
  )
}

function ProductCard({ product, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs">
        {product.category.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{product.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
        <StarRating score={product.similarity_score} />
      </div>
    </motion.div>
  )
}

function ProductResult({ data, preview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      {/* Result header */}
      <div className="flex items-center gap-4 mb-6">
        {preview && (
          <img src={preview} alt="uploaded" className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-lg" />
        )}
        <div>
          <p className="text-xs text-violet-400 uppercase tracking-widest font-semibold">Generated listing</p>
          <h2 className="text-xl font-bold text-white leading-tight mt-0.5">{data.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Category + bullets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gray-900 rounded-2xl border border-white/5 p-6"
          >
            <span className="inline-block bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {data.category}
            </span>
            <ul className="space-y-3">
              {data.bullet_features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="flex items-start gap-3 text-sm text-gray-300"
                >
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">✓</span>
                  {f}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-gray-900 rounded-2xl border border-white/5 p-6"
          >
            <h3 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">Product Description</h3>
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{data.detailed_description}</p>
          </motion.div>

          {/* Keywords */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
            className="bg-gray-900 rounded-2xl border border-white/5 p-6"
          >
            <h3 className="text-sm font-semibold text-gray-200 mb-3 uppercase tracking-wide">SEO Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((kw, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="bg-gray-800 text-gray-400 text-xs px-3 py-1.5 rounded-full border border-white/5 hover:border-violet-500/30 hover:text-violet-300 transition-colors"
                >
                  {kw}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gray-900 rounded-2xl border border-white/5 p-5"
          >
            <h3 className="text-sm font-semibold text-gray-200 mb-4 uppercase tracking-wide">Similar Products</h3>
            <div className="space-y-3">
              {data.retrieved_references.map((p, i) => (
                <ProductCard key={p.product_id} product={p} index={i} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main Demo page ── */
export default function Demo() {
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <header className="border-b border-white/5 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              IR
            </div>
            <span className="font-semibold text-white text-sm">IRS</span>
            <span className="text-gray-600 text-sm group-hover:text-gray-400 transition-colors hidden sm:block">← back to home</span>
          </Link>
          {result && (
            <button
              onClick={reset}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              New search
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page title */}
        <AnimatePresence>
          {!result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Generate a{' '}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  product listing
                </span>
              </h1>
              <p className="mt-3 text-gray-500">Upload a product image and watch CLIP + Claude do the work.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload form */}
        <AnimatePresence>
          {!result && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="max-w-lg mx-auto bg-gray-900/60 border border-white/5 rounded-2xl p-6 space-y-5 backdrop-blur"
            >
              <UploadZone onFile={handleFile} preview={preview} />

              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-500 whitespace-nowrap">Top-K similar:</label>
                <input
                  type="range" min={1} max={10} value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-sm font-semibold text-white w-4 text-right">{topK}</span>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Generating listing…
                  </>
                ) : (
                  <>
                    Generate Product Page
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && <LoadingState />}

        {/* Result */}
        {result && <ProductResult data={result} preview={preview} />}
      </main>
    </div>
  )
}
