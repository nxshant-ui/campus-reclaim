import React, { useState } from 'react';
import { X, User, Phone, Building, CreditCard, Shield, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, isAdmin, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [campusId, setCampusId] = useState(profile?.campusId || '');
  const [department, setDepartment] = useState(profile?.department || 'General Studies');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        displayName: displayName.trim(),
        campusId: campusId.trim(),
        department: department.trim(),
        phone: phone.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/80 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#EDE9FE] via-[#FFE4EC] to-[#DDF0FF] border-b border-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-sm border border-white flex items-center justify-center">
              <User className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#1E293B]">Campus Profile</h3>
              <p className="text-xs text-[#64748B] font-medium">
                Identity & Contact Details for Campus Reclaim
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/70 hover:bg-white text-[#475569] shadow-xs transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-[#D1FAE5] text-[#065F46] text-xs font-bold flex items-center gap-2 border border-[#A7F3D0]">
              <Check className="w-4 h-4" />
              <span>Campus profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] outline-none text-sm text-[#1E293B] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
              Campus ID / Badge Number
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="text"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                placeholder="e.g. STU-2024-8891"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] outline-none text-sm text-[#1E293B] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
              Department / Faculty
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] outline-none text-sm text-[#1E293B] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
              Phone Number (For Claim & Return SMS)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contact Phone Number"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] outline-none text-sm text-[#1E293B] font-medium"
              />
            </div>
          </div>

          {/* Account Role Info */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#6D28D9]" />
              <span className="text-xs font-bold text-[#1E293B]">Privilege Level</span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isAdmin
                  ? 'bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]'
                  : 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
              }`}
            >
              {isAdmin ? 'Campus Security Admin' : 'Enrolled Student'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-2xl bg-white border border-[#CBD5E1] text-[#475569] text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-[#6D28D9] hover:to-[#1D4ED8] shadow-md transition-all hover:scale-102"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
