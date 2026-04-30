import React from 'react';
import { MapPin, Calendar, Clock, Users, DollarSign, User, ArrowRight, Star } from 'lucide-react';

export default function RideCard({ ride, onBook, bookingLoading, compact = false }) {
  const dateStr = ride.date
    ? new Date(ride.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : '';

  const seatPct = ride.seats_total > 0
    ? Math.round(((ride.seats_total - ride.seats_available) / ride.seats_total) * 100)
    : 0;

  const seatStatus =
    ride.seats_available === 0  ? { label: 'Full',        cls: 'badge-red'   } :
    ride.seats_available <= 2   ? { label: 'Almost full', cls: 'badge-amber' } :
                                  { label: `${ride.seats_available} seats left`, cls: 'badge-green' };

  return (
    <div className="card-hover group flex flex-col gap-4 animate-fade-in">
      {/* Header: driver + seat badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {ride.driver_photo
            ? <img src={ride.driver_photo} alt="" className="w-11 h-11 avatar ring-2 ring-white shadow-sm" />
            : <div className="w-11 h-11 avatar-placeholder ring-2 ring-white shadow-sm font-bold text-sm">
                {ride.driver_name?.[0]?.toUpperCase() ?? 'D'}
              </div>
          }
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-tight">{ride.driver_name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-500">Driver</span>
            </div>
          </div>
        </div>
        <span className={seatStatus.cls}>{seatStatus.label}</span>
      </div>

      {/* Route */}
      <div className="relative flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-500 bg-white" />
          <div className="w-0.5 h-5 bg-gradient-to-b from-indigo-400 to-violet-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <p className="font-semibold text-slate-900 text-sm truncate">{ride.source}</p>
            <p className="text-xs text-slate-400">Pickup</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm truncate">{ride.destination}</p>
            <p className="text-xs text-slate-400">Drop-off</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-slate-300 shrink-0 group-hover:text-indigo-400 transition-colors" />
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Calendar, label: dateStr, sub: 'Date' },
          { icon: Clock,    label: ride.time, sub: 'Time' },
          { icon: Users,    label: ride.seats_total, sub: 'Total' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={sub} className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <Icon size={14} className="text-indigo-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-800 truncate">{label}</p>
            <p className="text-[10px] text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Seat progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{ride.seats_total - ride.seats_available}/{ride.seats_total} booked</span>
          <span>{seatPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${seatPct}%`,
              background: seatPct >= 100 ? '#f43f5e' : seatPct >= 80 ? '#f59e0b' : 'linear-gradient(90deg,#4f46e5,#7c3aed)',
            }}
          />
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        <div>
          <span className="text-2xl font-bold text-slate-900">${parseFloat(ride.price).toFixed(0)}</span>
          <span className="text-slate-400 text-sm">/seat</span>
        </div>
        {onBook && (
          <button
            onClick={() => onBook(ride)}
            disabled={ride.seats_available === 0 || bookingLoading}
            className={`btn-sm font-semibold ${
              ride.seats_available === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {ride.seats_available === 0 ? 'Fully Booked' : 'Book Now'}
          </button>
        )}
      </div>

      {ride.notes && (
        <p className="text-xs text-slate-400 italic leading-relaxed border-t border-slate-50 pt-2">
          "{ride.notes}"
        </p>
      )}
    </div>
  );
}
