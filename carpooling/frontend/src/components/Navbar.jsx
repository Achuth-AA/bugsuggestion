import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, User, LogOut, LayoutDashboard, Search, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout }    = useAuth();
  const navigate             = useNavigate();
  const location             = useLocation();
  const [open, setOpen]      = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const dashLink =
    user?.role === 'driver' ? '/dashboard/driver' :
    user?.role === 'admin'  ? '/admin' :
    '/dashboard/rider';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-100'
        : 'bg-white/80 backdrop-blur-sm border-b border-slate-100/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Car size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              Ride<span className="gradient-text">Share</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/rides" active={isActive('/rides')}>
              <Search size={15} /> Find Rides
            </NavLink>
            {user && (
              <NavLink to={dashLink} active={location.pathname.startsWith('/dashboard') || location.pathname === '/admin'}>
                <LayoutDashboard size={15} />
                {user.role === 'admin' ? 'Admin' : user.role === 'driver' ? 'My Rides' : 'My Bookings'}
              </NavLink>
            )}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group">
                  {user.profile_photo_url
                    ? <img src={user.profile_photo_url} alt="" className="w-7 h-7 avatar" />
                    : <div className="w-7 h-7 avatar-placeholder text-xs font-bold">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                  }
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{user.name}</span>
                  {user.role === 'admin' && <Shield size={13} className="text-violet-500" />}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  title="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm text-slate-600">Sign In</Link>
                <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            <MobileLink to="/rides"><Search size={16} /> Find Rides</MobileLink>
            {user ? (
              <>
                <MobileLink to={dashLink}>
                  <LayoutDashboard size={16} />
                  {user.role === 'admin' ? 'Admin Panel' : user.role === 'driver' ? 'My Rides' : 'My Bookings'}
                </MobileLink>
                <MobileLink to="/profile"><User size={16} /> Profile</MobileLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 text-sm font-medium transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login"    className="btn-secondary flex-1 justify-center">Sign In</Link>
                <Link to="/register" className="btn-primary  flex-1 justify-center">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}
