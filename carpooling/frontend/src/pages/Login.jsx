import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Car, Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function set(k) { return (e) => setForm((p) => ({ ...p, [k]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin')  return navigate('/admin');
      if (user.role === 'driver') return navigate('/dashboard/driver');
      navigate('/dashboard/rider');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-hero-gradient text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Car size={22} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">RideShare</span>
        </Link>

        <div className="relative">
          <blockquote className="text-2xl font-bold leading-snug mb-4 gradient-text-white">
            "Share the journey,<br />share the savings."
          </blockquote>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-sm">
            Join thousands of commuters saving money and reducing carbon emissions
            with AWS-powered real-time carpooling.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { label: 'EC2 Backend',    desc: 'Node.js REST API'       },
              { label: 'RDS MySQL',      desc: 'Ride & booking data'    },
              { label: 'AWS Cognito',    desc: 'Secure authentication'  },
              { label: 'SNS Alerts',     desc: 'Instant notifications'  },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-indigo-300 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-indigo-300 text-xs">© 2026 RideShare. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">RideShare</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="input-group">
              <label className="input-label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email" required autoComplete="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={form.email} onChange={set('email')}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="input-label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password} onChange={set('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-gradient text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="divider my-6">or</div>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline">
              Create one free
            </Link>
          </p>

          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-700 font-medium text-center">
              Authentication powered by <strong>AWS Cognito</strong> — your credentials are never stored locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
