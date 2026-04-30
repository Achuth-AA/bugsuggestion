import React, { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, MapPin, AlertCircle, Loader2, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ridesAPI, bookingsAPI } from '../services/api';
import RideCard from '../components/RideCard';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function SearchRides() {
  const { user }          = useAuth();
  const [rides, setRides]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bookModal, setBookModal] = useState(null);
  const [seats, setSeats]     = useState(1);
  const [filters, setFilters] = useState({
    source: '', destination: '', date: '', minPrice: '', maxPrice: '',
  });

  const set = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));

  const fetchRides = useCallback(async (params = {}) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await ridesAPI.search(params);
      setRides(res.data.rides);
    } catch {
      toast.error('Failed to load rides. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  function handleSearch(e) {
    e.preventDefault();
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    fetchRides(params);
  }

  function clearFilters() {
    setFilters({ source: '', destination: '', date: '', minPrice: '', maxPrice: '' });
    fetchRides();
  }

  const hasFilters = Object.values(filters).some(Boolean);

  async function handleBook(e) {
    e.preventDefault();
    if (!user)                return toast.error('Please sign in to book a ride');
    if (user.role !== 'rider') return toast.error('Only riders can book rides');

    setBooking(true);
    try {
      await bookingsAPI.book({ ride_id: bookModal.ride_id, seats_booked: parseInt(seats) });
      toast.success(`${seats} seat(s) booked! Check your email for the SNS confirmation.`);
      setBookModal(null);
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      fetchRides(params);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="page-title">Find a Ride</h1>
          <p className="page-subtitle">Search available rides — results cached by ElastiCache for instant response</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-6">
            <div className="flex gap-3 flex-col sm:flex-row">
              <div className="flex-1 grid sm:grid-cols-3 gap-3">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                  <input
                    className="input-field pl-10 bg-white"
                    placeholder="From (city)"
                    value={filters.source} onChange={set('source')}
                  />
                </div>
                <div className="relative">
                  <ArrowRight size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none" />
                  <input
                    className="input-field pl-10 bg-white"
                    placeholder="To (city)"
                    value={filters.destination} onChange={set('destination')}
                  />
                </div>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date" className="input-field pl-10 bg-white"
                    value={filters.date} onChange={set('date')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary gap-2 relative ${showFilters ? 'border-indigo-400 text-indigo-600' : ''}`}
                >
                  <SlidersHorizontal size={16} /> Filters
                  {hasFilters && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                  )}
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex items-center gap-2 bg-brand-gradient text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl animate-slide-down grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="input-label text-xs">Min Price ($)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="number" min="0" step="1" className="input-field pl-8 text-sm py-2 bg-white"
                      placeholder="0" value={filters.minPrice} onChange={set('minPrice')} />
                  </div>
                </div>
                <div>
                  <label className="input-label text-xs">Max Price ($)</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="number" min="0" step="1" className="input-field pl-8 text-sm py-2 bg-white"
                      placeholder="Any" value={filters.maxPrice} onChange={set('maxPrice')} />
                  </div>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={clearFilters}
                    className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-700 font-medium py-2 px-3 hover:bg-rose-50 rounded-lg transition-colors">
                    <X size={14} /> Clear all filters
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div>
            <div className="flex items-center gap-2 mb-6 text-slate-500 text-sm">
              <Loader2 size={15} className="animate-spin text-indigo-500" />
              <span>Searching rides…</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : rides.length === 0 && searched ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <MapPin size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No rides found</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
              Try adjusting your search filters or check back later for new rides.
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-outline btn-sm">
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-900">{rides.length} ride{rides.length !== 1 ? 's' : ''} available</p>
                {hasFilters && <span className="badge-indigo">Filtered</span>}
              </div>
              {!user && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <AlertCircle size={14} />
                  <span><Link to="/login" className="font-semibold underline">Sign in</Link> to book rides</span>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rides.map((ride) => (
                <RideCard
                  key={ride.ride_id}
                  ride={ride}
                  onBook={user?.role === 'rider' ? (r) => { setBookModal(r); setSeats(1); } : null}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Booking modal */}
      {bookModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setBookModal(null)}>
          <div className="modal-box max-w-sm">
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Confirm Booking</h2>
                <p className="text-xs text-slate-500 mt-0.5">Driver will be notified via SNS</p>
              </div>
              <button onClick={() => setBookModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="modal-body space-y-5">
              {/* Route summary */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full border-2 border-indigo-500" />
                  <div className="w-0.5 h-4 bg-indigo-300" />
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-900 text-sm">{bookModal.source}</p>
                  <p className="font-semibold text-slate-900 text-sm">{bookModal.destination}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-slate-500">{new Date(bookModal.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-xs font-medium text-slate-700">{bookModal.time}</p>
                </div>
              </div>

              <div>
                <label className="input-label">Seats to book <span className="text-slate-400 font-normal">(max {bookModal.seats_available})</span></label>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={() => setSeats(Math.max(1, seats - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-lg transition-colors">
                    −
                  </button>
                  <div className="flex-1 text-center py-2 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg text-slate-900">
                    {seats}
                  </div>
                  <button type="button" onClick={() => setSeats(Math.min(bookModal.seats_available, seats + 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold text-lg transition-colors">
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                <span className="text-sm font-medium text-slate-700">Total Cost</span>
                <span className="text-2xl font-black text-indigo-700">
                  ${(seats * parseFloat(bookModal.price)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <AlertCircle size={12} className="shrink-0" />
                You'll receive an SNS confirmation notification after booking.
              </div>
            </div>

            <form onSubmit={handleBook}>
              <div className="modal-footer flex gap-3">
                <button type="button" onClick={() => setBookModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={booking}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-gradient text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  {booking ? <><Loader2 size={14} className="animate-spin" /> Booking…</> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 skeleton rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 skeleton rounded w-24" />
          <div className="h-2.5 skeleton rounded w-14" />
        </div>
        <div className="h-5 skeleton rounded-full w-20" />
      </div>
      <div className="h-20 skeleton rounded-xl" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map((i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
      </div>
      <div className="h-1.5 skeleton rounded-full" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-7 skeleton rounded w-16" />
        <div className="h-8 skeleton rounded-xl w-24" />
      </div>
    </div>
  );
}
