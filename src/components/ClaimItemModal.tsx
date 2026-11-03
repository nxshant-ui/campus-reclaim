import React, { useState } from 'react';
import { X, ShieldCheck, Camera, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { LostFoundItem } from '../types';
import { createClaim } from '../firebase/claims';
import { compressImageFile } from '../utils/imageHelper';

interface ClaimItemModalProps {
  isOpen: boolean;
  item: LostFoundItem | null;
  onClose: () => void;
  onClaimSubmitted: (claimId: string) => void;
}

export const ClaimItemModal: React.FC<ClaimItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onClaimSubmitted,
}) => {
  const { user, profile } = useAuth();
  const [proofDetails, setProofDetails] = useState('');
  const [claimantPhone, setClaimantPhone] = useState(profile?.phone || '');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen || !item) return null;

  const handleProofImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImageLoading(true);
      setErrorMsg('');
      const compressed = await compressImageFile(file);
      setProofImageUrl(compressed);
    } catch {
      setErrorMsg('Could not process proof image.');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDetails.trim()) {
      setErrorMsg('Please describe your proof of ownership in detail.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const claimantName = profile?.displayName || user?.displayName || 'Student Claimant';
      const claimantEmail = profile?.email || user?.email || 'student@campus.portal';

      let claimId = 'claim_' + Date.now();
      if (auth.currentUser) {
        claimId = await createClaim({
          itemId: item.id,
          itemTitle: item.title,
          claimantId: auth.currentUser.uid,
          claimantName,
          claimantEmail,
          claimantPhone: claimantPhone.trim() || undefined,
          proofDetails: proofDetails.trim(),
          proofImageUrl: proofImageUrl || undefined,
          status: 'pending',
        });
      }

      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClaimSubmitted(claimId);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Submit claim error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit claim request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/80 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#FCE7F3] via-[#EDE9FE] to-[#DDF0FF] border-b border-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white/80 p-2 border border-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-[#1E293B]">
                  Claim Ownership
                </h3>
                <p className="text-xs text-[#64748B] font-medium">
                  Submit proof to verify and reclaim your belonging
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/70 hover:bg-white text-[#475569] hover:text-[#0F172A] shadow-xs transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Item Recap Banner */}
        <div className="p-4 bg-white/80 border-b border-[#E2E8F0] flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0]"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-xl">
              📦
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-[#1E293B] truncate">{item.title}</h4>
            <p className="text-xs text-[#64748B] truncate">Found at: {item.location}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D8F5E5] text-[#065F46] font-bold">
              Available for Claim
            </span>
          </div>
        </div>

        {/* Content */}
        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-extrabold text-lg text-[#1E293B]">Claim Submitted!</h4>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Campus Security has received your verification details. You can track status updates in your Claims tab.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-[#FFE4E6] text-[#9F1239] text-xs font-semibold flex items-center gap-2 border border-[#FECDD3]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Security Question if item has one */}
            {item.securityQuestion && (
              <div className="p-3.5 rounded-2xl bg-[#FFF5C2]/70 border border-[#FDE68A]">
                <p className="text-[11px] font-bold text-[#854D0E] uppercase tracking-wider mb-1">
                  💡 Security Verification Prompt:
                </p>
                <p className="text-xs font-semibold text-[#713F12]">"{item.securityQuestion}"</p>
              </div>
            )}

            {/* Detailed Proof */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Proof of Ownership / Distinguishing Details *
              </label>
              <textarea
                required
                rows={4}
                value={proofDetails}
                onChange={(e) => setProofDetails(e.target.value)}
                placeholder="Describe details not visible in photo: serial number, passwords, wallpaper, inner scratches, specific keychain, contents, date lost..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#EDE9FE] outline-none text-xs sm:text-sm text-[#1E293B] font-medium"
              />
            </div>

            {/* Proof Image Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Optional Proof Document or Photo (Receipt, Box, Photo with Item)
              </label>
              {proofImageUrl ? (
                <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-[#CBD5E1] bg-slate-100 flex items-center justify-center">
                  <img src={proofImageUrl} alt="Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofImageUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-[#CBD5E1] hover:border-[#7C3AED] rounded-2xl cursor-pointer bg-white/70 hover:bg-[#F3E8FF]/30 transition-all">
                  <Camera className="w-5 h-5 text-[#8B5CF6]" />
                  <span className="text-xs font-bold text-[#475569]">
                    Attach Photo / Receipt Proof
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofImageChange}
                    className="hidden"
                  />
                </label>
              )}
              {imageLoading && (
                <p className="text-[11px] text-[#7C3AED] font-semibold mt-1">Compressing proof photo...</p>
              )}
            </div>

            {/* Claimant Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
                Your Contact Phone (For Security Desk Notification)
              </label>
              <input
                type="tel"
                value={claimantPhone}
                onChange={(e) => setClaimantPhone(e.target.value)}
                placeholder="Contact phone (optional)"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] focus:border-[#7C3AED] outline-none text-xs sm:text-sm font-medium"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-2xl bg-white border border-[#CBD5E1] text-[#475569] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:from-[#6D28D9] hover:to-[#BE185D] shadow-md transition-all hover:scale-102 disabled:opacity-50"
              >
                {submitting ? 'Submitting Claim...' : 'Submit Claim Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
