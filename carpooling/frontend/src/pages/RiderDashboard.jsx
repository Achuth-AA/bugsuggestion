import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin, Calendar, Clock, DollarSign, ChevronRight,
  X, Users, CheckCircle, XCircle, Loader2, Search,
} from 'lucide-react';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RiderDashboard() {
  const { user }              = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab]   = useState('confirmed');

  useEffect(() => { fetchBookings(); }, []);

  async function fetchBookings() {
    try {
      const res = await bookingsAPI.myBookings();
      setBookings(res.data.bookings);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (!confirm('Cancel this booking? The driver will be notified via SNS.')) return;
    setCancelling(bookingId);
    try {
      await bookingsAPI.cancel({ booking_id: bookingId });
      toast.success('Booking cancelled. Driver has been notified.');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed');
    } finally {
      setCancelling(null);
    }
  }

  const confirmed  = bookings.filter((b) => b.status === 'confirmed');
  const cancelled  = bookings.filter((b) => b.status === 'cancelled');
  const tabBookings = activeTab === 'confirmed' ? confirmed : cancelled;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="page-title">My Bookings</h1>
            <p className="page-subtitle">Welcome back, {user?.name}</p>
          </div>
          <Link to="/rides" className="btn-primary gap-2 whitespace-nowrap text-sm">
            <Search size={16} /> Find a Ride
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: CheckCircle, label: 'Confirmed',  value: confirmed.length,  color: 'bg-emerald-50 text-emerald-600' },
            { icon: XCircle,     label: 'Cancelled',  value: cancelled.length,  color: 'bg-rose-50 text-rose-600'       },
            { icon: Users,       label: 'Total Seats', value: confirmed.reduce((a, b) => a + b.seats_booked, 0), color: 'bg-indigo-50 text-indigo-600' },
            { icon: DollarSign,  label: 'Total Spent', value: `$${confirmed.reduce((a, b) => a + b.seats_booked * parseFloat(b.price), 0).toFixed(0)}`, color: 'bg-violet-50 text-violet-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="stat-card">
              <div className={`stat-icon ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + list */}
        <div>
          <div className="tab-group w-fit mb-5">
            {[
              { key: 'confirmed', label: `Confirmed (${confirmed.length})` },
              { key: 'cancelled', label: `Cancelled (${cancelled.length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`tab-item ${activeTab === key ? 'tab-item-active' : 'tab-item-inactive'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-32" />)}
            </div>
          ) : tabBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MapPin size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                No {activeTab} bookings
              </h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                {activeTab === 'confirmed'
                  ? 'You have no active bookings. Find a ride to get started!'
                  : 'No cancelled bookings.'}
              </p>
              {activeTab === 'confirmed' && (
                <Link to="/rides" className="btn-primary btn-sm gap-2">
                  <Search size={14} /> Find a Ride
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tabBookings.map((b) => (
                <BookingRow
                  key={b.booking_id}
                  booking={b}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking: b, onCancel, cancelling }) {
  const dateStr = b.date
    ? new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : '';

  return (
    <div className="card animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 space-y-3">
          {/* Route */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <MapPin size={14} className="text-indigo-500 shrink-0" />
              {b.source}
              <ChevronRight size={14} className="text-slate-300" />
              {b.destination}
            </div>
            <span className={b.status === 'confirmed' ? 'badge-green' : 'badge-red'}>
              {b.status}
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />{dateStr}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />{b.time}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />{b.seats_booked} seat{b.seats_booked !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <DollarSign size={12} />${(b.seats_booked * parseFloat(b.price)).toFixed(2)} total
            </span>
          </div>

          {/* Driver info */}
          <div className="flex items-center gap-3 pt-1 text-sm text-slate-600">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
              {b.driver_name?.[0]?.toUpperCase()}
            </div>
            <span>Driver: <strong>{b.driver_name}</strong></span>
            {b.driver_phone && (
              <span className="text-slate-400">· {b.driver_phone}</span>
            )}
          </div>
        </div>

        {b.status === 'confirmed' && (
          <button
            onClick={() => onCancel(b.booking_id)}
            disabled={cancelling === b.booking_id}
            className="btn-sm flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 self-start"
          >
            {cancelling === b.booking_id
              ? <Loader2 size={12} className="animate-spin" />
              : <X size={13} />
            }
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
