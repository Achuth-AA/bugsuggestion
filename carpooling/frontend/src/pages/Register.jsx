import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Car, Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone, CheckCircle2, Car as CarIcon, Users } from 'lucide-react';
import { authAPI } from '../services/api';

const stepLabels = ['Account Info', 'Choose Role', 'Verify Email'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'rider', phone: '' });
  const [code, setCode]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  function set(k) { return (e) => setForm((p) => ({ ...p, [k]: e.target.value })); }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Check your email for the 6-digit code.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.confirm({ email: form.email, code });
      toast.success('Email verified! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const currentStep = step === 3 ? 3 : step <= 1 ? 1 : 2;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left decorative panel */}
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

        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-black gradient-text-white leading-tight mb-3">
              Start carpooling<br />in minutes
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Register as a rider to find and book rides, or as a driver to offer seats and earn money on your daily commute.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: CarIcon, title: 'Post your route', desc: 'Drivers set source, destination, date & price' },
              { icon: Users,   title: 'Book in seconds',  desc: 'Riders find and book available seats instantly' },
              { icon: CheckCircle2, title: 'Notifications', desc: 'Both parties get SNS alerts for every booking' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-indigo-300 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-indigo-300 text-xs">© 2026 RideShare. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">RideShare</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {stepLabels.map((label, idx) => {
              const n = idx + 1;
              const state = n < currentStep ? 'done' : n === currentStep ? 'active' : 'inactive';
              return (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`step-${state}`}>
                      {state === 'done' ? <CheckCircle2 size={14} /> : n}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-semibold leading-tight ${state === 'active' ? 'text-indigo-600' : state === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</p>
                    </div>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full ${n < currentStep ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 1 — Info */}
          {step === 1 && (
            <div key="step1" className="animate-slide-up">
              <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create account</h1>
                <p className="text-slate-500 mt-1">Enter your details to get started</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" required className="input-field pl-10" placeholder="Jane Doe"
                      value={form.name} onChange={set('name')} minLength={2} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="email" required className="input-field pl-10" placeholder="you@example.com"
                      value={form.email} onChange={set('email')} autoComplete="email" />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type={showPw ? 'text' : 'password'} required minLength={8}
                      className="input-field pl-10 pr-10" placeholder="At least 8 characters"
                      value={form.password} onChange={set('password')} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="tel" className="input-field pl-10" placeholder="+1 234 567 8900"
                      value={form.phone} onChange={set('phone')} />
                  </div>
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-brand-gradient text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all mt-2 text-base">
                  Continue <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {/* Step 2 — Role */}
          {step === 2 && (
            <div key="step2" className="animate-slide-up">
              <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Choose your role</h1>
                <p className="text-slate-500 mt-1">You can always have both roles in the future</p>
              </div>
              <div className="grid gap-4 mb-6">
                {[
                  {
                    value: 'rider',
                    icon: Users,
                    title: 'Rider',
                    subtitle: 'Find & book rides',
                    perks: ['Search rides by route & date', 'Book seats in seconds', 'Get booking confirmation via SNS'],
                    gradient: 'from-indigo-500 to-violet-500',
                  },
                  {
                    value: 'driver',
                    icon: CarIcon,
                    title: 'Driver',
                    subtitle: 'Offer & manage rides',
                    perks: ['Post available seats', 'Set your own price', 'Get notified when riders book'],
                    gradient: 'from-emerald-500 to-teal-500',
                  },
                ].map(({ value, icon: Icon, title, subtitle, perks, gradient }) => (
                  <label
                    key={value}
                    className={`relative flex gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.role === value
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <input type="radio" name="role" value={value} className="sr-only"
                      checked={form.role === value} onChange={() => setForm({ ...form, role: value })} />
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">{title}</p>
                        {form.role === value && <CheckCircle2 size={18} className="text-indigo-600" />}
                      </div>
                      <p className="text-slate-500 text-sm">{subtitle}</p>
                      <ul className="mt-2 space-y-1">
                        {perks.map((p) => (
                          <li key={p} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <CheckCircle2 size={11} className="text-emerald-500 shrink-0" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleRegister} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-gradient text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                    : <>Create Account <ArrowRight size={16} /></>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Verify */}
          {step === 3 && (
            <div key="step3" className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Mail size={28} className="text-indigo-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Check your inbox</h1>
                <p className="text-slate-500 mt-2 text-sm">
                  We sent a 6-digit code to<br />
                  <strong className="text-slate-800">{form.email}</strong>
                </p>
              </div>
              <form onSubmit={handleConfirm} className="space-y-5">
                <div className="input-group">
                  <label className="input-label text-center block">Enter verification code</label>
                  <input
                    type="text" required maxLength={6} inputMode="numeric" pattern="\d{6}"
                    className="input-field text-center text-3xl font-bold tracking-[0.5em] py-4"
                    placeholder="• • • • • •"
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button type="submit" disabled={loading || code.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-brand-gradient text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 text-base"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                    : <>Verify & Continue <ArrowRight size={18} /></>
                  }
                </button>
                <p className="text-center text-xs text-slate-400">
                  Didn't receive it?{' '}
                  <button type="button" className="text-indigo-600 font-medium hover:underline">Resend code</button>
                </p>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
