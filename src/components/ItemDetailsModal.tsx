import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Share2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { LostFoundItem } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { updateItem, deleteItem } from '../firebase/items';
import { findSimilarItems } from '../utils/matchingEngine';

interface ItemDetailsModalProps {
  isOpen: boolean;
  item: LostFoundItem | null;
  allItems?: LostFoundItem[];
  onClose: () => void;
  onClaim: (item: LostFoundItem) => void;
  onSelectSimilarItem?: (item: LostFoundItem) => void;
  onItemUpdated?: () => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  item,
  allItems = [],
  onClose,
  onClaim,
  onSelectSimilarItem,
  onItemUpdated,
}) => {
  const { user, isAdmin } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const similarMatches = allItems.length > 0 ? findSimilarItems(item, allItems, 35) : [];
  const isLost = item.itemType === 'lost';

  const categoryMeta = getCategoryMeta(item.category);
  const isOwner = user && (user.uid === item.reportedBy || user.email === item.reportedByEmail);
  const canManage = isOwner || isAdmin;

  const handleMarkReturned = async () => {
    try {
      setUpdating(true);
      if (auth.currentUser && !item.id.startsWith('sample_')) {
        await updateItem(item.id, { status: 'returned' });
      } else {
        item.status = 'returned';
      }
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A3E7C3', '#D8CEF6', '#FDC2D6', '#FFCAB0', '#BAE0FD'],
      });
      if (onItemUpdated) onItemUpdated();
      onClose();
    } catch (err) {
      console.error('Error marking returned:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campus report?')) return;
    try {
      setUpdating(true);
      if (auth.currentUser && !item.id.startsWith('sample_')) {
        await deleteItem(item.id);
      }
      if (onItemUpdated) onItemUpdated();
      onClose();
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setUpdating(false);
    }
  };


  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-white/80 overflow-hidden z-10 my-8">
        {/* Header */}
        <div
          className={`p-5 sm:p-6 flex items-center justify-between ${
            isLost
              ? 'bg-gradient-to-r from-[#FFE5D9] via-[#FFD6D0] to-[#FFE4EC]'
              : 'bg-gradient-to-r from-[#D8F5E5] via-[#E8E2F8] to-[#DDF0FF]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase tracking-wider font-extrabold px-3 py-1 rounded-xl shadow-xs ${
                isLost ? 'bg-[#FFEDD5] text-[#9A3412]' : 'bg-[#D1FAE5] text-[#065F46]'
              }`}
            >
              {isLost ? 'Lost Item Report' : 'Found on Campus'}
            </span>

            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-xl border ${categoryMeta.bgPastel} ${categoryMeta.textPastel} ${categoryMeta.borderPastel}`}
            >
              {categoryMeta.icon} {categoryMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Share report"
              className="p-2 rounded-xl bg-white/70 hover:bg-white text-[#475569] shadow-xs text-xs font-medium flex items-center gap-1 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/70 hover:bg-white text-[#475569] hover:text-[#0F172A] shadow-xs transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Photo Preview if available */}
          {item.imageUrl && (
            <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 border border-[#E2E8F0] shadow-sm">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title & Status */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B]">
                {item.title}
              </h2>
              <div>
                {item.status === 'open' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D8F5E5] text-[#065F46] border border-[#A3E7C3]">
                    Active / Open
                  </span>
                )}
                {item.status === 'claimed' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF5C2] text-[#854D0E] border border-[#FDE68A]">
                    Claim in Review
                  </span>
                )}
                {item.status === 'returned' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8E2F8] text-[#5B21B6] border border-[#D8CEF6]">
                    Returned to Owner ✨
                  </span>
                )}
              </div>
            </div>

            {/* Location & Date Pills */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-[#475569]">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
                <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                <span className="font-semibold text-[#1E293B]">{item.location}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
                <Calendar className="w-3.5 h-3.5 text-[#6366F1]" />
                <span>{item.incidentDate}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Item Details & Notes
            </h4>
            <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
              {item.description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Security Question Prompt */}
          {item.securityQuestion && (
            <div className="p-4 rounded-2xl bg-[#EDE9FE]/70 border border-[#DDD6FE]">
              <h4 className="text-xs font-bold text-[#6D28D9] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#7C3AED]" />
                Ownership Verification Question
              </h4>
              <p className="text-sm font-semibold text-[#4C1D95]">
                "{item.securityQuestion}"
              </p>
              <p className="text-[11px] text-[#6D28D9] mt-1">
                Anyone claiming this item must answer this question with security desk staff.
              </p>
            </div>
          )}

          {/* Reporter Information */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2E8F0]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Reported By
            </h4>
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center font-bold text-[#475569]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#1E293B]">
                    {item.reportedByName || 'Campus Member'}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    {item.reportedByEmail || 'Registered Campus Account'}
                  </p>
                </div>
              </div>
              {item.contactPhone && (
                <div className="flex items-center gap-1 text-[#475569] font-medium bg-white px-2.5 py-1 rounded-xl border border-[#E2E8F0]">
                  <Phone className="w-3.5 h-3.5 text-[#059669]" />
                  <span>{item.contactPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Similar Items Recommendations */}
          {similarMatches.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FEF3C7] to-[#FAF8F5] border border-[#FDE68A] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#92400E] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  AI Smart Matches in Registry ({similarMatches.length})
                </h4>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Similar Items Found
                </span>
              </div>
              <div className="space-y-2">
                {similarMatches.slice(0, 2).map((match, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-xl border border-amber-200/60 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                          {match.score}% Match
                        </span>
                        <h5 className="font-bold text-xs text-slate-800 truncate">
                          {match.candidateItem.title}
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        Spot: {match.candidateItem.location} • {match.reasons[0] || 'Keyword overlap'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        if (onSelectSimilarItem) onSelectSimilarItem(match.candidateItem);
                      }}
                      className="text-[11px] font-bold text-[#7C3AED] hover:underline shrink-0 bg-[#EDE9FE] hover:bg-[#DDD6FE] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Compare
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-[#E2E8F0]">
            <div>
              {canManage && (
                <button
                  onClick={handleDelete}
                  disabled={updating}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECDD3] flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Report</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canManage && item.status !== 'returned' && (
                <button
                  onClick={handleMarkReturned}
                  disabled={updating}
                  className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-[#E8E2F8] hover:bg-[#D8CEF6] text-[#5B21B6] border border-[#D8CEF6] flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  <span>Mark as Reunited & Returned</span>
                </button>
              )}

              {!isLost && item.status === 'open' && (
                <button
                  onClick={() => {
                    onClose();
                    onClaim(item);
                  }}
                  className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#059669] to-[#7C3AED] hover:from-[#047857] hover:to-[#6D28D9] shadow-md transition-all hover:scale-102"
                >
                  Claim This Item
                </button>
              )}

              {isLost && item.status === 'open' && (
                <a
                  href={`mailto:${item.reportedByEmail}?subject=Found your lost item: ${encodeURIComponent(item.title)}`}
                  className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#EA580C] to-[#E11D48] hover:from-[#C2410C] hover:to-[#BE185D] shadow-md transition-all hover:scale-102 inline-flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>I Found This / Contact Owner</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
