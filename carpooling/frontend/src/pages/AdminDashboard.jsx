import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Car, Calendar, TrendingUp, RefreshCw, Shield } from 'lucide-react';
import { adminAPI } from '../services/api';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([adminAPI.stats(), adminAPI.users()]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleUser(userId, isActive) {
    try {
      if (isActive) {
        await adminAPI.deactivateUser(userId);
        toast.success('User deactivated');
      } else {
        await adminAPI.activateUser(userId);
        toast.success('User activated');
      }
      loadData();
    } catch {
      toast.error('Action failed');
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview'         },
    { key: 'users',    label: 'Users'             },
    { key: 'rides',    label: 'Recent Rides'      },
    { key: 'bookings', label: 'Recent Bookings'   },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Shield size={20} className="text-violet-600" />
            </div>
            <div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Platform overview &amp; management</p>
            </div>
          </div>
          <button onClick={loadData} className="btn-secondary gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="card animate-pulse h-24" />)}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users,      label: 'Total Users',    value: stats?.totalUsers,    color: 'bg-indigo-50 text-indigo-600' },
                { icon: Car,        label: 'Total Rides',    value: stats?.totalRides,    color: 'bg-sky-50 text-sky-600'       },
                { icon: TrendingUp, label: 'Active Rides',   value: stats?.activeRides,   color: 'bg-violet-50 text-violet-600' },
                { icon: Calendar,   label: 'Total Bookings', value: stats?.totalBookings, color: 'bg-amber-50 text-amber-600'   },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="stat-card">
                  <div className={`stat-icon ${color}`}><Icon size={20} /></div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{value ?? '—'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Role breakdown */}
            {stats?.roleBreakdown && (
              <div className="card">
                <p className="section-label">User Breakdown</p>
                <div className="flex gap-8 mt-1">
                  {stats.roleBreakdown.map((r) => (
                    <div key={r.role} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                        r.role === 'admin'  ? 'bg-violet-100 text-violet-700' :
                        r.role === 'driver' ? 'bg-sky-100 text-sky-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.count}
                      </div>
                      <p className="text-sm font-medium text-slate-700 capitalize">{r.role}s</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div>
              <div className="tab-group w-fit mb-6">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`tab-item ${tab === t.key ? 'tab-item-active' : 'tab-item-inactive'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'overview' && (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="card">
                    <p className="section-label">Recent Rides</p>
                    <div className="space-y-3 mt-2">
                      {stats?.recentRides?.slice(0, 5).map((r) => (
                        <div key={r.ride_id} className="flex items-center justify-between text-sm gap-2">
                          <span className="text-slate-700 font-medium truncate">{r.source} → {r.destination}</span>
                          <span className={
                            r.status === 'active'    ? 'badge-green'  :
                            r.status === 'cancelled' ? 'badge-red'    : 'badge-slate'
                          }>{r.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <p className="section-label">Recent Bookings</p>
                    <div className="space-y-3 mt-2">
                      {stats?.recentBookings?.slice(0, 5).map((b) => (
                        <div key={b.booking_id} className="flex items-center justify-between text-sm gap-2">
                          <span className="text-slate-700 font-medium truncate">{b.rider_name} — {b.source}</span>
                          <span className={b.status === 'confirmed' ? 'badge-green' : 'badge-red'}>{b.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'users' && (
                <div className="card overflow-x-auto p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.user_id}>
                          <td className="font-medium text-slate-900">{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={
                              u.role === 'admin'  ? 'badge-violet' :
                              u.role === 'driver' ? 'badge-indigo' : 'badge-green'
                            }>{u.role}</span>
                          </td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={u.is_active ? 'badge-green' : 'badge-red'}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleUser(u.user_id, u.is_active)}
                                className={`text-xs font-semibold transition-colors ${
                                  u.is_active
                                    ? 'text-rose-500 hover:text-rose-700'
                                    : 'text-emerald-600 hover:text-emerald-800'
                                }`}
                              >
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'rides' && (
                <div className="card overflow-x-auto p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Route</th>
                        <th>Driver</th>
                        <th>Date</th>
                        <th>Seats Left</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentRides?.map((r) => (
                        <tr key={r.ride_id}>
                          <td className="font-medium text-slate-900">{r.source} → {r.destination}</td>
                          <td>{r.driver_name}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.seats_available}</td>
                          <td>
                            <span className={
                              r.status === 'active'    ? 'badge-green' :
                              r.status === 'cancelled' ? 'badge-red'   : 'badge-slate'
                            }>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'bookings' && (
                <div className="card overflow-x-auto p-0">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rider</th>
                        <th>Route</th>
                        <th>Seats</th>
                        <th>Status</th>
                        <th>Booked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentBookings?.map((b) => (
                        <tr key={b.booking_id}>
                          <td className="font-medium text-slate-900">{b.rider_name}</td>
                          <td>{b.source} → {b.destination}</td>
                          <td>{b.seats_booked}</td>
                          <td>
                            <span className={b.status === 'confirmed' ? 'badge-green' : 'badge-red'}>
                              {b.status}
                            </span>
                          </td>
                          <td>{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
