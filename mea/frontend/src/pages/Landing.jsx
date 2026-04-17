import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

const features = [
  {
    icon: '🖼️',
    title: 'CLIP Image Embeddings',
    desc: 'OpenAI\'s CLIP ViT-B/32 converts your product photo into a 512-dimensional semantic vector — understanding what the product is, not just pixel colours.',
  },
  {
    icon: '⚡',
    title: 'FAISS Vector Search',
    desc: 'Facebook\'s FAISS performs blazing-fast cosine similarity search over thousands of indexed products to surface the most relevant matches in milliseconds.',
  },
  {
    icon: '🤖',
    title: 'Claude AI Generation',
    desc: 'Claude\'s vision model describes the image, then its text model writes a complete, SEO-optimised Amazon-style listing — title, bullets, description, keywords.',
  },
  {
    icon: '🛒',
    title: 'Amazon-Style Output',
    desc: 'Instantly get a publish-ready product page with structured bullet features, detailed descriptions, and search keywords tailored to the product.',
  },
]

const steps = [
  { num: '01', title: 'Upload Image', desc: 'Drag & drop any product photo — JPG, PNG, or WebP up to 10 MB.' },
  { num: '02', title: 'CLIP Encodes', desc: 'Your image is embedded into a 512-dim semantic vector using CLIP ViT-B/32.' },
  { num: '03', title: 'FAISS Retrieves', desc: 'Top-K most similar products are retrieved from the indexed catalog via cosine similarity.' },
  { num: '04', title: 'Claude Writes', desc: 'Claude Vision describes the image; Claude Text generates the full listing from vision + retrieved context.' },
]

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-violet-500/30">
            IR
          </div>
          <span className="font-semibold text-white tracking-tight">IRS</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
        </nav>
        <Link
          to="/demo"
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-500/25"
        >
          Try Demo →
        </Link>
      </div>
    </header>
  )
}

function HeroOrb({ className }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <HeroOrb className="w-[600px] h-[600px] bg-violet-600 -top-40 -left-40" />
        <HeroOrb className="w-[500px] h-[500px] bg-indigo-600 top-20 -right-40" />
        <HeroOrb className="w-[400px] h-[400px] bg-fuchsia-600 bottom-0 left-1/3" />

        <motion.div {...fadeUp(0)} className="relative">
          <span className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Powered by CLIP · FAISS · Claude AI
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="relative text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl"
        >
          Turn any product photo into a{' '}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            perfect listing
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="relative mt-6 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed"
        >
          Upload a product image and get a complete, SEO-ready Amazon-style product page — title, bullet features, description, and keywords — generated in seconds.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="relative mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <Link
            to="/demo"
            className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-base transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2">
              Try it free
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium text-base transition-all hover:bg-white/5"
          >
            See how it works
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          {...fadeUp(0.45)}
          className="relative mt-20 grid grid-cols-3 gap-8 md:gap-16"
        >
          {[['512-dim', 'CLIP vectors'], ['< 1s', 'Retrieval time'], ['Claude AI', 'Content engine']].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-white">{val}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-violet-400 text-sm font-semibold uppercase tracking-widest">Features</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Everything you need</h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">State-of-the-art ML pipeline from image to published listing, all in one shot.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-violet-500/30 transition-colors cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-violet-400 text-sm font-semibold uppercase tracking-widest">Process</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">How it works</h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">Four stages from raw image to publish-ready product page.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex flex-col items-center justify-center mb-4">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">{s.num}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 px-6 border-t border-white/5">
        <HeroOrb className="w-[500px] h-[500px] bg-violet-700 top-0 left-1/2 -translate-x-1/2" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center max-w-2xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to generate?</h2>
          <p className="mt-4 text-gray-400 text-lg">Drop a product image and get your listing in seconds.</p>
          <Link
            to="/demo"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-base transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
          >
            Open Demo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">IR</div>
            <span>IRS — Image Retrieval System</span>
          </div>
          <span>Built with CLIP · FAISS · Claude AI · React</span>
        </div>
      </footer>
    </div>
  )
}
