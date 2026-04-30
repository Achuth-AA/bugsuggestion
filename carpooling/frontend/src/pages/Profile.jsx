import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Camera, Mail, Phone, Shield, Car, Users, Loader2 } from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_META = {
  admin:  { icon: Shield, label: 'Admin',  cls: 'badge-violet', iconCls: 'bg-violet-100 text-violet-600' },
  driver: { icon: Car,    label: 'Driver', cls: 'badge-indigo', iconCls: 'bg-indigo-100 text-indigo-600' },
  rider:  { icon: Users,  label: 'Rider',  cls: 'badge-green',  iconCls: 'bg-emerald-100 text-emerald-600' },
};

export default function Profile() {
  const { user, setUser }  = useAuth();
  const [form, setForm]    = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  const role = ROLE_META[user?.role] ?? ROLE_META.rider;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await usersAPI.update(form);
      setUser({ ...user, ...form });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Photo must be under 5 MB');

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await usersAPI.uploadPhoto(formData);
      setUser({ ...user, profile_photo_url: res.data.photoUrl });
      toast.success('Photo updated');
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account details and photo</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-5 animate-fade-in">
        {/* Identity card */}
        <div className="card flex items-center gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative shrink-0">
            {user?.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt=""
                className="w-20 h-20 avatar ring-2 ring-indigo-100"
              />
            ) : (
              <div className="w-20 h-20 avatar-placeholder ring-2 ring-indigo-100">
                <User size={30} />
              </div>
            )}
            <label className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-md ${
              uploading
                ? 'bg-slate-300 pointer-events-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}>
              {uploading
                ? <Loader2 size={13} className="animate-spin text-white" />
                : <Camera size={13} className="text-white" />
              }
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploading} />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-sm text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <Mail size={13} className="text-slate-400 shrink-0" />
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={role.cls}>{role.label}</span>
              {uploading && (
                <span className="text-xs text-indigo-600 font-medium">Uploading to S3…</span>
              )}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <p className="section-label">Edit Profile</p>
          <form onSubmit={handleSave} className="space-y-4 mt-3">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text" required
                  className="input-field pl-10"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Phone <span className="font-normal text-slate-400">(optional)</span></label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  className="input-field pl-10"
                  placeholder="+1 234 567 8900"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email" disabled
                  className="input-field pl-10 bg-slate-50 text-slate-400 cursor-not-allowed"
                  value={user?.email}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Email is managed by <strong>AWS Cognito</strong> and cannot be changed here.
              </p>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                : 'Save Changes'
              }
            </button>
          </form>
        </div>

        {/* Role info */}
        <div className="card flex items-center gap-4 bg-slate-50 border-slate-200">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${role.iconCls}`}>
            <role.icon size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Account Role: {role.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.role === 'driver'
                ? 'You can post rides and manage bookings from your driver dashboard.'
                : user?.role === 'admin'
                ? 'You have full access to platform management and user administration.'
                : 'You can search and book rides from the ride search page.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
