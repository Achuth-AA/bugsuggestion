import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Users, X, Car, MapPin, Calendar, Clock, DollarSign,
  TrendingUp, CheckCircle, XCircle, Loader2, Bell, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { ridesAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS = {
  active:    { label: 'Active',    cls: 'badge-green'  },
  completed: { label: 'Completed', cls: 'badge-slate'  },
  cancelled: { label: 'Cancelled', cls: 'badge-red'    },
};

export default function DriverDashboard() {
  const { user }   = useAuth();
  const [rides, setRides]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [viewBookings, setViewBookings] = useState(null);
  const [rideBookings, setRideBookings] = useState([]);
  const [bkLoading, setBkLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab]   = useState('active');

  const [form, setForm] = useState({
    source: '', destination: '', date: '', time: '',
    seats_available: 1, price: '', notes: '',
  });

  useEffect(() => { fetchRides(); }, []);

  async function fetchRides() {
    try {
      const res = await ridesAPI.myRides();
      setRides(res.data.rides);
    } catch {
      toast.error('Failed to load rides');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRide(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ridesAPI.create({
        ...form,
        seats_available: parseInt(form.seats_available),
        price: parseFloat(form.price),
      });
      toast.success('Ride posted! Riders can now book your seats.');
      setShowForm(false);
      resetForm();
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post ride');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm({ source: '', destination: '', date: '', time: '', seats_available: 1, price: '', notes: '' });
  }

  async function handleCancel(rideId) {
    if (!confirm('Cancel this ride? All riders will be notified via SNS.')) return;
    setCancelling(rideId);
    try {
      await ridesAPI.cancel(rideId);
      toast.success('Ride cancelled. Riders have been notified.');
      fetchRides();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  }

  async function handleViewBookings(rideId) {
    setBkLoading(true);
    setViewBookings(rideId);
    try {
      const res = await bookingsAPI.rideBookings(rideId);
      setRideBookings(res.data.bookings);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setBkLoading(false);
    }
  }

  const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const activeRides    = rides.filter((r) => r.status === 'active');
  const completedRides = rides.filter((r) => r.status === 'completed');
  const cancelledRides = rides.filter((r) => r.status === 'cancelled');
  const totalSeats     = rides.reduce((a, r) => a + (r.seats_total || 0), 0);
  const totalBookings  = rides.reduce((a, r) => a + Number(r.total_bookings || 0), 0);

  const tabRides = activeTab === 'active' ? activeRides : activeTab === 'completed' ? completedRides : cancelledRides;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center gap-4">
          <div>
            <h1 className="page-title">Driver Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-gradient text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm whitespace-nowrap"
          >
            <Plus size={18} /> Post a Ride
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Car,         label: 'Total Rides',    value: rides.length,   color: 'bg-indigo-50 text-indigo-600' },
            { icon: CheckCircle, label: 'Active Rides',   value: activeRides.length, color: 'bg-emerald-50 text-emerald-600' },
            { icon: Users,       label: 'Total Bookings', value: totalBookings,  color: 'bg-violet-50 text-violet-600' },
            { icon: TrendingUp,  label: 'Total Seats',    value: totalSeats,     color: 'bg-amber-50 text-amber-600' },
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

        {/* Tabs */}
        <div>
          <div className="tab-group w-fit mb-5">
            {[
              { key: 'active',    label: `Active (${activeRides.length})` },
              { key: 'completed', label: `Completed (${completedRides.length})` },
              { key: 'cancelled', label: `Cancelled (${cancelledRides.length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`tab-item ${activeTab === key ? 'tab-item-active' : 'tab-item-inactive'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="card animate-pulse h-36" />)}
            </div>
          ) : tabRides.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Car size={26} /></div>
              <h3 className="font-bold text-slate-700 mb-1">No {activeTab} rides</h3>
              <p className="text-slate-400 text-sm">
                {activeTab === 'active' ? 'Post a ride to start getting bookings!' : `No ${activeTab} rides yet.`}
              </p>
              {activeTab === 'active' && (
                <button onClick={() => setShowForm(true)} className="btn-primary mt-4 btn-sm">
                  <Plus size={14} /> Post First Ride
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tabRides.map((ride) => (
                <RideRow
                  key={ride.ride_id}
                  ride={ride}
                  onViewBookings={handleViewBookings}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create ride modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box max-w-lg">
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Post a New Ride</h2>
                <p className="text-xs text-slate-500 mt-0.5">Riders will get an SNS notification</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateRide}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">From</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                      <input required className="input-field pl-8 text-sm" placeholder="New York"
                        value={form.source} onChange={setF('source')} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">To</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none" />
                      <input required className="input-field pl-8 text-sm" placeholder="Boston"
                        value={form.destination} onChange={setF('destination')} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Date</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="date" required className="input-field pl-8 text-sm"
                        min={new Date().toISOString().split('T')[0]}
                        value={form.date} onChange={setF('date')} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Departure Time</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="time" required className="input-field pl-8 text-sm"
                        value={form.time} onChange={setF('time')} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Seats Available</label>
                    <div className="relative">
                      <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="number" min="1" max="20" required className="input-field pl-8 text-sm"
                        value={form.seats_available} onChange={setF('seats_available')} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Price per Seat ($)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input type="number" min="0" step="0.01" required className="input-field pl-8 text-sm"
                        placeholder="25.00" value={form.price} onChange={setF('price')} />
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                  <textarea rows={2} className="input-field resize-none text-sm"
                    placeholder="Luggage space, pet-friendly, AC, etc."
                    value={form.notes} onChange={setF('notes')} />
                </div>

                {/* Preview */}
                {form.price && form.seats_available && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-indigo-700 font-medium">Potential earnings</span>
                    <span className="font-bold text-indigo-900">
                      ${(parseFloat(form.price) * parseInt(form.seats_available)).toFixed(2)} (if full)
                    </span>
                  </div>
                )}
              </div>
              <div className="modal-footer flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-gradient text-white font-bold py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Posting…</> : <><Plus size={14} /> Post Ride</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookings modal */}
      {viewBookings && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewBookings(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ride Bookings</h2>
                <p className="text-xs text-slate-500 mt-0.5">{rideBookings.length} confirmed booking{rideBookings.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setViewBookings(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="modal-body">
              {bkLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
              ) : rideBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rideBookings.map((b) => (
                    <div key={b.booking_id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                        {b.rider_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{b.rider_name}</p>
                        <p className="text-xs text-slate-500 truncate">{b.rider_email}</p>
                        {b.rider_phone && <p className="text-xs text-slate-400">{b.rider_phone}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-indigo-700 text-sm">{b.seats_booked} seat{b.seats_booked !== 1 ? 's' : ''}</p>
                        <span className="badge-green text-[10px]">Confirmed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RideRow({ ride, onViewBookings, onCancel, cancelling }) {
  const s = STATUS[ride.status] ?? STATUS.active;
  const seatPct = ride.seats_total > 0
    ? Math.round(((ride.seats_total - ride.seats_available) / ride.seats_total) * 100)
    : 0;

  return (
    <div className="card animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <MapPin size={14} className="text-indigo-500" />
              {ride.source}
              <ChevronRight size={14} className="text-slate-300" />
              {ride.destination}
            </div>
            <span className={s.cls}>{s.label}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={12} />{new Date(ride.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Clock size={12} />{ride.time}</span>
            <span className="flex items-center gap-1"><DollarSign size={12} />${parseFloat(ride.price).toFixed(2)}/seat</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700"><Users size={12} />{ride.total_bookings || 0} booked</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{ride.seats_total - ride.seats_available}/{ride.seats_total} seats booked</span>
              <span>{seatPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${seatPct}%`, background: seatPct >= 100 ? '#f43f5e' : seatPct >= 80 ? '#f59e0b' : 'linear-gradient(90deg,#4f46e5,#7c3aed)' }} />
            </div>
          </div>
        </div>

        {ride.status === 'active' && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onViewBookings(ride.ride_id)}
              className="btn-secondary btn-sm gap-1.5">
              <Users size={13} /> Bookings
            </button>
            <button onClick={() => onCancel(ride.ride_id)} disabled={cancelling === ride.ride_id}
              className="btn-sm flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors">
              {cancelling === ride.ride_id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
