import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ItemClaim, LostFoundItem } from '../types';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { verifyClaimRecovery } from '../firebase/claims';
import { useAuth } from '../context/AuthContext';

interface VerifyHandoverModalProps {
  isOpen: boolean;
  claims: ItemClaim[];
  items: LostFoundItem[];
  onClose: () => void;
  onSuccess?: (claimId: string) => void;
}

export const VerifyHandoverModal: React.FC<VerifyHandoverModalProps> = ({
  isOpen,
  claims,
  items,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successClaim, setSuccessClaim] = useState<ItemClaim | null>(null);
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessClaim(null);

    const cleanCode = codeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter a recovery code.');
      return;
    }

    // Try finding matching claim
    const matchedClaim = claims.find(
      (c) =>
        (c.recoveryCode && c.recoveryCode.toUpperCase() === cleanCode) ||
        (cleanCode.length >= 4 && c.id.toUpperCase().includes(cleanCode)) ||
        (c.status === 'approved' && cleanCode === `REC-${c.id.slice(-4).toUpperCase()}-SAFE`)
    );

    if (!matchedClaim) {
      setErrorMsg('No approved claim found matching this code. Please check the code.');
      return;
    }

    if (matchedClaim.status === 'returned') {
      setErrorMsg('This item has ALREADY been officially returned and verified.');
      return;
    }

    if (matchedClaim.status !== 'approved') {
      setErrorMsg(`This claim is currently ${matchedClaim.status}. Only approved claims can be handed over.`);
      return;
    }

    setVerifying(true);
    try {
      const verifier = profile?.displayName || user?.displayName || 'Campus Security';
      await verifyClaimRecovery(matchedClaim.id, cleanCode, verifier, matchedClaim.itemId);
      
      matchedClaim.status = 'returned';
      setSuccessClaim(matchedClaim);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34D399', '#A78BFA', '#F472B6', '#60A5FA'],
      });

      onSuccess?.(matchedClaim.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Verification failed: ${msg}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl shadow-2xl border border-[#E9D5FF] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#DDD6FE] via-[#FCE7F3] to-[#FEF3C7] px-6 py-5 border-b border-[#E9D5FF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#7C3AED] shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E293B] text-base">Verify Recovery Pass</h3>
              <p className="text-xs text-[#6B7280]">Item Handover Security Desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/60 text-[#6B7280] hover:text-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-left">
          {successClaim ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-[#D8F5E5] text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-[#1E293B]">Item Successfully Handed Over!</h4>
                <p className="text-xs text-[#64748B] mt-1">
                  The claim for <strong>"{successClaim.itemTitle}"</strong> is now marked as Returned & Reunited.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
                <p className="text-slate-500">Claimant: <strong className="text-slate-800">{successClaim.claimantName}</strong></p>
                <p className="text-slate-500">Item ID: <strong className="text-slate-800">{successClaim.itemId}</strong></p>
                <p className="text-slate-500">Verified By: <strong className="text-slate-800">{profile?.displayName || 'Campus Security'}</strong></p>
              </div>

              <button
                onClick={() => {
                  setSuccessClaim(null);
                  setCodeInput('');
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold shadow-md hover:bg-[#6D28D9] transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-xs text-[#475569] leading-relaxed">
                Enter the student's 8-character recovery code or scan their QR code to verify ownership before handing over the belonging.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recovery Verification Code
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. REC-8A9B-44F2"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono uppercase bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#C4B5FD]"
                  />
                </div>
              </div>

              {/* Sample codes helper if any approved claims exist */}
              {claims.some((c) => c.status === 'approved') && (
                <div className="p-3 bg-[#EDE9FE]/50 rounded-2xl border border-[#DDD6FE] text-xs">
                  <p className="text-[11px] font-bold text-[#6D28D9] uppercase tracking-wider mb-1">
                    Ready for Handover:
                  </p>
                  <div className="space-y-1">
                    {claims
                      .filter((c) => c.status === 'approved')
                      .slice(0, 2)
                      .map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => setCodeInput(c.recoveryCode || `REC-${c.id.slice(-4).toUpperCase()}-SAFE`)}
                          className="w-full text-left p-1.5 rounded-lg bg-white/80 hover:bg-white text-[11px] font-semibold text-slate-700 flex items-center justify-between"
                        >
                          <span className="truncate">{c.itemTitle}</span>
                          <span className="font-mono text-[#7C3AED] shrink-0 font-bold">
                            {c.recoveryCode || `REC-${c.id.slice(-4).toUpperCase()}-SAFE`}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {verifying ? 'Verifying...' : 'Verify & Hand Over'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
