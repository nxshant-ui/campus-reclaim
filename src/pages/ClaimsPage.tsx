import React, { useState } from 'react';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MapPin,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  QrCode,
} from 'lucide-react';
import { ItemClaim, LostFoundItem, PageView } from '../types';
import { useAuth } from '../context/AuthContext';
import { CampusConfig } from '../firebase/settings';
import { QRRecoveryModal } from '../components/QRRecoveryModal';

interface ClaimsPageProps {
  claims: ItemClaim[];
  items: LostFoundItem[];
  onNavigate: (page: PageView) => void;
  onSelectItem: (item: LostFoundItem) => void;
  config?: CampusConfig;
}

export const ClaimsPage: React.FC<ClaimsPageProps> = ({
  claims,
  items,
  onNavigate,
  onSelectItem,
  config,
}) => {
  const { user, isAdmin } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClaimForQR, setSelectedClaimForQR] = useState<ItemClaim | null>(null);


  const filteredClaims = claims.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const getAssociatedItem = (itemId: string) => {
    return items.find((i) => i.id === itemId);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Banner: Pink + Pastel Purple Theme */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#FCE7F3] via-[#EDE9FE] to-[#FAF8F5] p-6 sm:p-10 border border-[#FBCFE8] shadow-pastel-pink">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-xs font-bold text-[#9D174D] mb-3 border border-white">
              <FileCheck className="w-4 h-4 text-[#DB2777]" />
              <span>Ownership Verification & Claim Tracking</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight">
              My Claims Tracker
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1 leading-relaxed">
              Track the live verification progress of your submitted claims. Once approved by the
              {config?.officeName ? ` ${config.officeName}` : ' Campus Office'}, you will receive pickup instructions and safe collection details.
            </p>
          </div>

          <button
            onClick={() => onNavigate('browse')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#DB2777] to-[#7C3AED] hover:from-[#BE185D] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102 self-start md:self-center"
          >
            Browse Items
          </button>
        </div>

        {/* Filter Pills */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-[#BE185D] text-white shadow-xs'
                : 'bg-white/80 text-[#475569] hover:bg-white'
            }`}
          >
            All Claims ({claims.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'pending'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'bg-white/80 text-[#475569] hover:bg-white'
            }`}
          >
            In Review ({claims.filter((c) => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'approved'
                ? 'bg-[#059669] text-white shadow-xs'
                : 'bg-white/80 text-[#475569] hover:bg-white'
            }`}
          >
            Approved & Ready ({claims.filter((c) => c.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilterStatus('returned')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'returned'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'bg-white/80 text-[#475569] hover:bg-white'
            }`}
          >
            Reunited ✨ ({claims.filter((c) => c.status === 'returned').length})
          </button>
        </div>
      </section>

      {/* Claims List */}
      <section className="space-y-6">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => {
            const item = getAssociatedItem(claim.itemId);
            const isApproved = claim.status === 'approved';
            const isReturned = claim.status === 'returned';
            const isRejected = claim.status === 'rejected';
            const isPending = claim.status === 'pending';

            return (
              <div
                key={claim.id}
                className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-6 transition-all hover:border-[#D8CEF6]"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FCE7F3] flex items-center justify-center text-xl text-[#BE185D] border border-[#FBCFE8]">
                      🪪
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-lg text-[#1E293B]">
                          {claim.itemTitle || 'Claimed Belonging'}
                        </h3>
                        <span
                          className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                              : isReturned
                              ? 'bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]'
                              : isRejected
                              ? 'bg-[#FFE4E6] text-[#9F1239] border border-[#FECDD3]'
                              : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          }`}
                        >
                          {isApproved
                            ? 'Approved for Pickup'
                            : isReturned
                            ? 'Reunited & Handed Over'
                            : isRejected
                            ? 'Verification Declined'
                            : 'Pending Security Review'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B]">
                        Claim ID: {claim.id} • Submitted on{' '}
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                    {isApproved && (
                      <button
                        onClick={() => setSelectedClaimForQR(claim)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Show QR Recovery Pass</span>
                      </button>
                    )}
                    {item && (
                      <button
                        onClick={() => onSelectItem(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EDE9FE] text-[#6D28D9] text-xs font-bold border border-[#E2E8F0] flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Original Item</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Tracker (4 Steps) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="p-3 rounded-2xl bg-[#EDE9FE]/50 border border-[#DDD6FE]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#6D28D9] mb-1">
                      <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
                      <span>1. Claim Filed</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">Proof received</p>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      !isPending
                        ? 'bg-[#EDE9FE]/50 border-[#DDD6FE] text-[#6D28D9]'
                        : 'bg-[#FEF3C7]/60 border-[#FDE68A] text-[#92400E]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      {isPending ? (
                        <Clock className="w-4 h-4 animate-spin text-[#D97706]" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
                      )}
                      <span>2. Safety Review</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      {isPending ? 'Under active review' : 'Review completed'}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isApproved || isReturned
                        ? 'bg-[#D1FAE5]/60 border-[#A7F3D0] text-[#065F46]'
                        : isRejected
                        ? 'bg-[#FFE4E6]/50 border-[#FECDD3] text-[#9F1239]'
                        : 'bg-slate-50 border-[#E2E8F0] text-[#94A3B8]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      {isApproved || isReturned ? (
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                      ) : isRejected ? (
                        <XCircle className="w-4 h-4 text-[#E11D48]" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#94A3B8]" />
                      )}
                      <span>3. Desk Approval</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      {isApproved
                        ? 'Ready for collection'
                        : isRejected
                        ? 'Additional proof needed'
                        : 'Awaiting decision'}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      isReturned
                        ? 'bg-[#EDE9FE] border-[#DDD6FE] text-[#5B21B6]'
                        : 'bg-slate-50 border-[#E2E8F0] text-[#94A3B8]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                      {isReturned ? (
                        <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#94A3B8]" />
                      )}
                      <span>4. Reunited ✨</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      {isReturned ? 'Handed back safely' : 'Final hand-over'}
                    </p>
                  </div>
                </div>

                {/* Submitted Proof Details & Officer Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2E8F0]">
                    <h4 className="font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                      Your Submitted Proof of Ownership
                    </h4>
                    <p className="text-[#334155] leading-relaxed whitespace-pre-wrap">
                      {claim.proofDetails}
                    </p>
                    {claim.proofImageUrl && (
                      <div className="mt-2 w-28 h-20 rounded-xl overflow-hidden border border-[#E2E8F0]">
                        <img
                          src={claim.proofImageUrl}
                          alt="Proof attachment"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
                    <h4 className="font-bold uppercase tracking-wider text-[#065F46] mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#059669]" />
                      {config?.officeName || 'Campus Administration'} Instructions
                    </h4>
                    {claim.adminNotes ? (
                      <p className="text-[#166534] font-medium leading-relaxed">
                        {claim.adminNotes}
                      </p>
                    ) : (
                      <p className="text-[#047857]/80">
                        Verification in progress. Once approved, the exact collection instructions
                        and pickup details will be posted here.
                      </p>
                    )}
                    <div className="mt-3 pt-2 border-t border-[#BBF7D0]/60 text-[11px] text-[#065F46] font-semibold">
                      Location: {config?.locationInfo || 'Designated Campus Reclaim Office'} • {config?.pickupInstructions || 'Bring your valid Student or Staff ID card.'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 rounded-3xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#FCE7F3] text-[#BE185D] flex items-center justify-center text-3xl mx-auto">
              📋
            </div>
            <h3 className="font-extrabold text-lg text-[#1E293B]">No claim records found</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Have you spotted something that belongs to you in the Found Items catalog? Submit a
              claim with your proof details to recover it.
            </p>
            <button
              onClick={() => onNavigate('browse')}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#DB2777] to-[#7C3AED] text-white text-xs font-bold shadow-sm"
            >
              Browse Items
            </button>
          </div>
        )}
      </section>

      {/* QR Code Pass Modal */}
      <QRRecoveryModal
        isOpen={Boolean(selectedClaimForQR)}
        claim={selectedClaimForQR}
        onClose={() => setSelectedClaimForQR(null)}
        canVerify={isAdmin}
        onVerifySuccess={(claimId) => {
          const target = claims.find((c) => c.id === claimId);
          if (target) target.status = 'returned';
          setSelectedClaimForQR(null);
        }}
      />
    </div>
  );
};

