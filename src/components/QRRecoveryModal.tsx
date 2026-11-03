import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { ItemClaim } from '../types';
import { X, CheckCircle, Copy, Check, ShieldCheck, QrCode } from 'lucide-react';

interface QRRecoveryModalProps {
  isOpen: boolean;
  claim: ItemClaim | null;
  onClose: () => void;
  onVerifySuccess?: (claimId: string) => void;
  canVerify?: boolean; // admin or finder can verify handover
}

export const QRRecoveryModal: React.FC<QRRecoveryModalProps> = ({
  isOpen,
  claim,
  onClose,
  onVerifySuccess,
  canVerify = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const recoveryCode = claim?.recoveryCode || `REC-${claim?.id.slice(-4).toUpperCase() || '7A9B'}-SAFE`;

  useEffect(() => {
    if (isOpen && claim && canvasRef.current) {
      const qrData = JSON.stringify({
        app: 'Campus Reclaim',
        type: 'item_recovery',
        claimId: claim.id,
        itemId: claim.itemId,
        code: recoveryCode,
      });

      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: 220,
          margin: 1.5,
          color: {
            dark: '#312E81', // deep indigo/purple
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [isOpen, claim, recoveryCode]);

  if (!isOpen || !claim) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateVerification = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#A78BFA', '#6EE7B7', '#FDE68A', '#93C5FD', '#F472B6'],
        });
      } catch (e) {
        console.warn('confetti warning:', e);
      }
      onVerifySuccess?.(claim.id);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl shadow-2xl border border-[#E9D5FF] overflow-hidden">
        {/* Header with pastel gradient */}
        <div className="bg-gradient-to-r from-[#DDD6FE] via-[#FCE7F3] to-[#FEF3C7] px-6 py-5 border-b border-[#E9D5FF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#7C3AED] shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E293B] text-base">Campus Reclaim Pass</h3>
              <p className="text-xs text-[#6B7280]">Official Recovery Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/60 text-[#6B7280] hover:text-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D8F5E5] text-[#065F46] border border-[#A7F3D0]">
              <CheckCircle className="w-3.5 h-3.5" />
              Ownership Claim Approved
            </span>
            <h4 className="mt-2 text-lg font-bold text-[#1E293B]">{claim.itemTitle}</h4>
            <p className="text-xs text-[#6B7280]">Claimant: {claim.claimantName}</p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-[#DDD6FE] shadow-inner max-w-[260px] mx-auto">
            <canvas ref={canvasRef} className="rounded-xl shadow-xs" />
            <p className="text-[11px] font-medium text-[#6B7280] mt-2">
              Scan at Security or Drop-off Desk
            </p>
          </div>

          {/* Recovery Code Display */}
          <div className="bg-[#F5F3FF] p-3.5 rounded-2xl border border-[#DDD6FE]">
            <p className="text-[11px] font-semibold text-[#6D28D9] uppercase tracking-wider">
              Verification Code
            </p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="font-mono text-xl font-bold tracking-widest text-[#4C1D95]">
                {recoveryCode}
              </span>
              <button
                onClick={handleCopyCode}
                title="Copy Code"
                className="p-1.5 rounded-lg bg-white text-[#7C3AED] hover:bg-[#EDE9FE] transition-colors shadow-2xs border border-[#DDD6FE]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-left text-xs bg-[#FFFBEB] p-3 rounded-2xl border border-[#FDE68A] text-[#92400E] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#D97706]" />
              Safe Handover Instructions
            </div>
            <p className="text-[11px] leading-relaxed">
              Show this pass to campus security staff or the designated finder. When scanned, the item is marked as officially recovered and archived.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-[#475569] hover:bg-slate-100 transition-colors"
            >
              Done / Close
            </button>
            {canVerify && (
              <button
                onClick={handleSimulateVerification}
                disabled={verifying}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-semibold shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Mark as Handed Over'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
