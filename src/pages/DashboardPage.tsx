import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Building,
  User as UserIcon,
  ShieldAlert,
  ArrowRight,
  Info,
  Layers,
  QrCode,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { ItemClaim, LostFoundItem, PageView, MatchSuggestion } from '../types';
import { CampusConfig } from '../firebase/settings';
import { ItemCard } from '../components/ItemCard';
import { findSimilarItems } from '../utils/matchingEngine';
import { QRRecoveryModal } from '../components/QRRecoveryModal';
import { deleteItem, updateItem } from '../firebase/items';

interface DashboardPageProps {
  items: LostFoundItem[];
  userClaims: ItemClaim[];
  config: CampusConfig;
  onNavigate: (page: PageView) => void;
  onSelectItem: (item: LostFoundItem) => void;
  onClaimItem: (item: LostFoundItem) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
  onOpenProfileModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  items,
  userClaims,
  config,
  onNavigate,
  onSelectItem,
  onClaimItem,
  onOpenReportModal,
  onOpenProfileModal,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'my_items' | 'ai_matches' | 'my_claims'>('my_items');
  const [selectedClaimForPass, setSelectedClaimForPass] = useState<ItemClaim | null>(null);

  // Filter items reported by this user (or fallback for demo)
  const userItems = items.filter(
    (i) =>
      (user && i.reportedBy === user.uid) ||
      (profile?.email && i.reportedByEmail === profile.email) ||
      (user?.uid === 'student_member_uid' && i.reportedBy === 'student_member_1')
  );

  const myLostCount = userItems.filter((i) => i.itemType === 'lost').length;
  const myFoundCount = userItems.filter((i) => i.itemType === 'found').length;
  const myReturnedCount = userItems.filter((i) => i.status === 'returned').length;

  // Calculate AI match suggestions for all user's lost items against found items
  const lostItemsToMatch = userItems.filter((i) => i.itemType === 'lost' && i.status === 'open');
  // If user hasn't reported a lost item yet, use the open lost items in the system to demonstrate AI matching power
  const sampleTargetLost =
    lostItemsToMatch.length > 0
      ? lostItemsToMatch
      : items.filter((i) => i.itemType === 'lost' && i.status === 'open').slice(0, 2);

  const allMatches: MatchSuggestion[] = [];
  sampleTargetLost.forEach((lostItem) => {
    const matches = findSimilarItems(lostItem, items, 35);
    allMatches.push(...matches);
  });

  // Deduplicate and sort
  const sortedMatches = allMatches.sort((a, b) => b.score - a.score);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to remove this item report?')) return;
    try {
      await deleteItem(itemId);
    } catch (e) {
      console.warn('delete item error:', e);
    }
  };

  const handleMarkItemReturned = async (item: LostFoundItem) => {
    try {
      await updateItem(item.id, { status: 'returned' });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A3E7C3', '#D8CEF6', '#BAE0FD'],
      });
    } catch (e) {
      console.warn('update item error:', e);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left">
      {/* Header: Mint + Sky Blue Theme */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#D8F5E5] via-[#DDF0FF] to-[#FAF8F5] p-6 sm:p-10 border border-[#A3E7C3]/60 shadow-pastel-mint">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt="Profile"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-white shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B]">
                  Welcome back, {profile?.displayName || user?.displayName || 'Student'}!
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#A3E7C3] text-[#065F46]">
                  {isAdmin ? 'Admin' : 'Student'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1">
                {profile?.department || 'College Department'} •{' '}
                <span className="font-bold text-[#059669]">
                  {profile?.campusId || 'ID: Registered'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={onOpenProfileModal}
              className="px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-[#1E293B] border border-[#CBD5E1] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-[#64748B]" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FFE5D9] to-[#FFD6D0] hover:from-[#FFCAB0] hover:to-[#FFAAA0] text-[#9A3412] border border-[#FFCAB0] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#EA580C]" />
              <span>Report Lost Item</span>
            </button>
            <button
              onClick={() => onOpenReportModal('found')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#D8F5E5] to-[#A3E7C3] hover:from-[#A3E7C3] hover:to-[#6EE7B7] text-[#065F46] border border-[#A3E7C3] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#059669]" />
              <span>Report Found Item</span>
            </button>
          </div>
        </div>

        {/* 4 Pastel Stat Cards (Mint + Sky Blue) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-white/80 border border-white shadow-xs">
            <div className="flex items-center justify-between text-[#065F46] mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">My Lost Reports</span>
              <span className="text-xl">🔍</span>
            </div>
            <p className="text-2xl font-black text-[#1E293B]">{myLostCount}</p>
            <p className="text-[11px] text-[#64748B]">Items you reported missing</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-white shadow-xs">
            <div className="flex items-center justify-between text-[#0369A1] mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Found & Turned In</span>
              <span className="text-xl">✨</span>
            </div>
            <p className="text-2xl font-black text-[#1E293B]">{myFoundCount}</p>
            <p className="text-[11px] text-[#64748B]">Items you submitted</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-white shadow-xs">
            <div className="flex items-center justify-between text-[#7C3AED] mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Claims Submitted</span>
              <span className="text-xl">📋</span>
            </div>
            <p className="text-2xl font-black text-[#1E293B]">{userClaims.length}</p>
            <p className="text-[11px] text-[#64748B]">Ownership claims</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-white shadow-xs">
            <div className="flex items-center justify-between text-[#15803D] mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Reunited Items</span>
              <span className="text-xl">🎉</span>
            </div>
            <p className="text-2xl font-black text-[#1E293B]">{myReturnedCount}</p>
            <p className="text-[11px] text-[#64748B]">Successfully recovered</p>
          </div>
        </div>
      </section>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('my_items')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'my_items'
              ? 'bg-gradient-to-r from-[#D1FAE5] to-[#E0F2FE] text-[#047857] shadow-xs border border-[#A7F3D0]'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
          }`}
        >
          My Reported Items ({userItems.length})
        </button>

        <button
          onClick={() => setActiveTab('ai_matches')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'ai_matches'
              ? 'bg-gradient-to-r from-[#FEF3C7] to-[#FCE7F3] text-[#B45309] shadow-xs border border-[#FDE68A]'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Similar Matches ({sortedMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_claims')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'my_claims'
              ? 'bg-gradient-to-r from-[#FCE7F3] to-[#EDE9FE] text-[#9D174D] shadow-xs border border-[#FBCFE8]'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'
          }`}
        >
          My Claims ({userClaims.length})
        </button>
      </div>

      {/* Tab 1: My Reported Items */}
      {activeTab === 'my_items' && (
        <div className="space-y-4">
          {userItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userItems.map((item) => (
                <div key={item.id} className="relative group">
                  <ItemCard
                    item={item}
                    onSelect={onSelectItem}
                    onClaim={onClaimItem}
                    isOwnerOrAdmin={true}
                  />
                  <div className="mt-2 flex items-center justify-between px-2 text-xs">
                    {item.status !== 'returned' ? (
                      <button
                        onClick={() => handleMarkItemReturned(item)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark Recovered</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-indigo-700">
                        ✨ Reunited
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-white border border-[#E2E8F0] text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D1FAE5] text-[#059669] flex items-center justify-center text-2xl mx-auto">
                📦
              </div>
              <h3 className="font-extrabold text-lg text-[#1E293B]">
                You haven't reported any items yet
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Did you misplace something or pick up an unattended belonging on campus? Create a report.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onOpenReportModal('lost')}
                  className="px-4 py-2 rounded-2xl bg-[#FFE5D9] text-[#9A3412] text-xs font-bold border border-[#FFCAB0] cursor-pointer"
                >
                  Report Lost Item
                </button>
                <button
                  onClick={() => onOpenReportModal('found')}
                  className="px-4 py-2 rounded-2xl bg-[#D8F5E5] text-[#065F46] text-xs font-bold border border-[#A3E7C3] cursor-pointer"
                >
                  Report Found Item
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: AI Matches & Intelligent Suggestions */}
      {activeTab === 'ai_matches' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FEF3C7] via-[#FFFBEB] to-white border border-[#FDE68A] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#92400E]">AI-Powered Lost & Found Matching</h4>
                <p className="text-xs text-[#B45309]">
                  Compares category, keywords, incident dates, and campus locations to suggest matching items.
                </p>
              </div>
            </div>
          </div>

          {sortedMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedMatches.map((match, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#DDD6FE] transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#D8F5E5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {match.score}% Match Confidence
                    </span>

                    <span className="text-[11px] font-semibold text-slate-500">
                      Found Item
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    {match.candidateItem.imageUrl ? (
                      <img
                        src={match.candidateItem.imageUrl}
                        alt={match.candidateItem.title}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center text-xl shrink-0">
                        📦
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                        {match.candidateItem.title}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{match.candidateItem.location}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                        {match.candidateItem.description}
                      </p>
                    </div>
                  </div>

                  {/* Reasons list */}
                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-0.5">
                    <p className="font-semibold text-slate-700">Why this matches:</p>
                    {match.reasons.map((r, i) => (
                      <p key={i} className="flex items-center gap-1 text-[11px]">
                        <span className="text-emerald-600 font-bold">✓</span> {r}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectItem(match.candidateItem)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onClaimItem(match.candidateItem)}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all"
                    >
                      Claim This Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800">No Potential Matches Detected Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                As more students report found belongings in campus locations, the AI matching engine will automatically highlight candidate items here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Claims */}
      {activeTab === 'my_claims' && (
        <div className="space-y-4">
          {userClaims.length > 0 ? (
            <div className="space-y-3">
              {userClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-base text-[#1E293B]">
                        {claim.itemTitle || 'Claimed Item'}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          claim.status === 'approved'
                            ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                            : claim.status === 'returned'
                            ? 'bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]'
                            : claim.status === 'rejected'
                            ? 'bg-[#FFE4E6] text-[#9F1239] border border-[#FECDD3]'
                            : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        }`}
                      >
                        {claim.status === 'approved'
                          ? 'Approved - Ready for Collection'
                          : claim.status === 'returned'
                          ? 'Returned & Closed'
                          : claim.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending Review'}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] line-clamp-2">
                      Proof details: "{claim.proofDetails}"
                    </p>
                    {claim.adminNotes && (
                      <p className="text-xs font-medium text-[#7C3AED] mt-1 bg-[#F5F3FF] p-2 rounded-xl border border-[#EDE9FE]">
                        Instructions: {claim.adminNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    {claim.status === 'approved' && (
                      <button
                        onClick={() => setSelectedClaimForPass(claim)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Recovery QR Pass</span>
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate('claims')}
                      className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EDE9FE] text-[#6D28D9] border border-[#E2E8F0] text-xs font-bold transition-all"
                    >
                      View Tracker
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-white border border-[#E2E8F0] text-center space-y-2">
              <FileCheck className="w-12 h-12 text-[#94A3B8] mx-auto" />
              <h3 className="font-bold text-sm text-[#1E293B]">No active claim submissions</h3>
              <p className="text-xs text-[#64748B]">
                When you locate your belonging in the catalog, submit a claim with your proof details.
              </p>
              <button
                onClick={() => onNavigate('browse')}
                className="mt-2 px-4 py-2 rounded-2xl bg-[#D8F5E5] text-[#065F46] text-xs font-bold cursor-pointer"
              >
                Browse Items
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR Code Pass Modal */}
      <QRRecoveryModal
        isOpen={Boolean(selectedClaimForPass)}
        claim={selectedClaimForPass}
        onClose={() => setSelectedClaimForPass(null)}
      />

      {/* Configurable Campus Contact & Office Notice */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-[#E0F2FE] via-[#EDE9FE] to-white border border-[#BAE0FD] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-2 border border-white flex items-center justify-center text-[#0284C7] shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#0369A1]">{config.officeName}</h4>
            <p className="text-xs text-[#334155] mt-0.5">
              {config.locationInfo} • {config.officeHours}
            </p>
            <p className="text-[11px] text-[#475569] mt-0.5">{config.pickupInstructions}</p>
          </div>
        </div>
        <div className="text-xs font-bold text-[#0369A1] bg-white/80 px-3.5 py-2 rounded-xl border border-white/60 shrink-0">
          {config.contactEmail || 'Contact Campus Desk'}
        </div>
      </section>
    </div>
  );
};
