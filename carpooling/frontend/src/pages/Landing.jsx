import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, MapPin, Bell, Shield, Zap, Users, ArrowRight,
  CheckCircle, Star, Clock, Database, Cloud, Cpu,
} from 'lucide-react';

const stats = [
  { value: 'AWS-Powered', label: 'Cloud Infrastructure', icon: Cloud },
  { value: 'Real-time',   label: 'Seat Updates',         icon: Zap },
  { value: 'SNS Alerts',  label: 'Instant Notifications',icon: Bell },
  { value: 'Cognito',     label: 'Secure Auth',          icon: Shield },
];

const features = [
  {
    icon: MapPin,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Smart Search & Filters',
    desc: 'Find rides by location, date, and price. Results cached by ElastiCache Redis for lightning-fast response times.',
    badge: 'ElastiCache',
  },
  {
    icon: Bell,
    color: 'bg-violet-50 text-violet-600',
    title: 'Instant Notifications',
    desc: 'Drivers and riders get real-time SMS + email alerts via AWS SNS on every booking and cancellation.',
    badge: 'AWS SNS',
  },
  {
    icon: Shield,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Secure Authentication',
    desc: 'AWS Cognito powers signup, login, and email verification — with full JWT token management.',
    badge: 'Cognito',
  },
  {
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Real-time Seat Booking',
    desc: 'Atomic DB transactions prevent double-bookings. Seat counts update instantly across all users.',
    badge: 'RDS MySQL',
  },
  {
    icon: Users,
    color: 'bg-rose-50 text-rose-600',
    title: 'Role-Based Dashboards',
    desc: 'Dedicated experiences for Riders, Drivers, and Admins — each with their own tools and views.',
    badge: 'Role Auth',
  },
  {
    icon: Cloud,
    color: 'bg-sky-50 text-sky-600',
    title: 'CloudWatch Monitoring',
    desc: 'Real-time metrics, alarms, and logs keep the platform healthy with proactive AWS CloudWatch alerts.',
    badge: 'CloudWatch',
  },
];

const steps = [
  { icon: Users,  title: 'Create Account', desc: 'Sign up as a rider or driver in seconds. AWS Cognito secures your account with email verification.' },
  { icon: Search2, title: 'Find or Post', desc: 'Riders search for rides by route and date. Drivers post available seats with price.' },
  { icon: Car,    title: 'Book & Go',     desc: 'Book seats instantly. Both driver and rider get SNS notifications confirming the trip.' },
];

function Search2(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target);
    if (isNaN(end)) return;
    const step = Math.ceil(end / 40);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}{suffix}</span>;
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient text-white min-h-[88vh] flex items-center">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AWS Cloud-Powered Platform
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] mb-6">
              Share the Ride,<br />
              <span className="gradient-text-white">Split the Cost</span>
            </h1>

            <p className="text-lg text-indigo-200 leading-relaxed mb-10 max-w-lg">
              Connect with drivers and riders for affordable, eco-friendly carpooling.
              Built on AWS for real-time updates, instant notifications, and enterprise-grade reliability.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/rides"
                className="flex items-center justify-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-4 px-8 rounded-2xl transition-all hover:shadow-xl hover:-translate-y-0.5 text-base"
              >
                Find a Ride <ArrowRight size={18} />
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold py-4 px-8 rounded-2xl transition-all text-base backdrop-blur-sm"
              >
                Offer a Ride
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-10 text-sm text-indigo-200">
              {['Free to join', 'SNS Notifications', 'Secure by AWS Cognito'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-400" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: floating cards */}
          <div className="hidden lg:flex items-center justify-center relative h-80">
            {/* Main card */}
            <div className="card-glass p-5 w-72 animate-float shadow-2xl">
              <div className="flex items-center gap-2 mb-4 text-slate-900">
                <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center">
                  <Car size={14} className="text-white" />
                </div>
                <span className="font-semibold text-sm">New Ride Available</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 mb-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full border-2 border-indigo-500" />
                  <div className="w-0.5 h-6 bg-indigo-200" />
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                </div>
                <div className="text-sm space-y-2">
                  <p className="font-semibold">New York, NY</p>
                  <p className="font-semibold">Boston, MA</p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Clock size={11} /> Today, 9:00 AM</span>
                <span className="flex items-center gap-1"><Users size={11} /> 3 seats</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl text-slate-900">$25<span className="text-xs font-normal text-slate-400">/seat</span></span>
                <div className="badge-green text-xs">Available</div>
              </div>
            </div>

            {/* Notification badge */}
            <div className="absolute -top-6 -right-2 card-glass px-4 py-2.5 animate-float text-slate-900 shadow-lg" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Bell size={12} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold">Booking Confirmed</p>
                  <p className="text-[10px] text-slate-500">SNS notification sent</p>
                </div>
              </div>
            </div>

            {/* Stats badge */}
            <div className="absolute -bottom-4 -left-4 card-glass px-4 py-2.5 animate-float shadow-lg" style={{ animationDelay: '3s' }}>
              <div className="flex items-center gap-2 text-slate-900">
                <Database size={14} className="text-indigo-500" />
                <div>
                  <p className="text-xs font-bold">Redis Cache Hit</p>
                  <p className="text-[10px] text-slate-500">ElastiCache • 3ms response</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 52C120 44 240 28 360 24C480 20 600 28 720 32C840 36 960 36 1080 30C1200 24 1320 12 1380 6L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* ── AWS Services Banner ─────────────────────────────────── */}
      <section className="py-10 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">Powered by AWS Cloud Services</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['EC2','RDS (MySQL)','AWS Cognito','Amazon S3','AWS SNS','ElastiCache (Redis)','CloudWatch'].map((s) => (
              <div key={s} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-xs">
                <Cpu size={13} className="text-indigo-500" />
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center animate-fade-in">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Icon size={22} className="text-indigo-600" />
              </div>
              <p className="text-xl font-black text-slate-900">{value}</p>
              <p className="text-slate-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label">Simple Process</p>
            <h2 className="text-4xl font-black text-slate-900">How RideShare Works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-indigo-200 to-violet-200" />
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="text-center relative animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow">
                  <Icon size={26} className="text-white" />
                </div>
                <div className="w-7 h-7 mx-auto -mt-2 mb-4 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
                  {i + 1}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="section-label">Platform Features</p>
            <h2 className="text-4xl font-black text-slate-900">Built for Scale</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Every feature backed by enterprise AWS cloud services, ready to handle thousands of concurrent rides</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, color, title, desc, badge }, i) => (
              <div key={title}
                className="card group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={20} />
                </div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{title}</h3>
                  <span className="badge-indigo text-[10px] shrink-0">{badge}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4 gradient-text-white">Ready to share your first ride?</h2>
          <p className="text-indigo-200 mb-10 text-lg">Join thousands of commuters saving money and reducing emissions together.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold py-4 px-10 rounded-2xl hover:bg-indigo-50 transition-all hover:shadow-xl hover:-translate-y-0.5 text-base"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link
              to="/rides"
              className="flex items-center justify-center gap-2 border-2 border-white/40 text-white font-bold py-4 px-10 rounded-2xl hover:bg-white/10 transition-all text-base"
            >
              Browse Rides
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 text-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-brand-gradient rounded-lg flex items-center justify-center">
            <Car size={13} className="text-white" />
          </div>
          <span className="font-semibold text-white">RideShare</span>
        </div>
        <p>© 2026 RideShare · Built on AWS: EC2 · RDS · S3 · SNS · ElastiCache · Cognito · CloudWatch</p>
      </footer>
    </div>
  );
}
