import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Sparkles,
  AlertCircle,
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  MapPin,
  Settings,
  Plus,
  Mail,
  Phone,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { ItemClaim, LostFoundItem, ClaimStatus, ItemStatus } from '../types';
import { CampusConfig } from '../firebase/settings';
import { updateClaimStatus, deleteClaim } from '../firebase/claims';
import { updateItem, deleteItem, SAMPLE_CAMPUS_ITEMS, createItem } from '../firebase/items';

interface AdminPageProps {
  claims: ItemClaim[];
  items: LostFoundItem[];
  config: CampusConfig;
  onSaveConfig: (newConfig: CampusConfig) => Promise<void>;
  onSelectItem: (item: LostFoundItem) => void;
  onRefreshData?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  claims,
  items,
  config,
  onSaveConfig,
  onSelectItem,
  onRefreshData,
}) => {
  const { user, profile, isAdmin, signInDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<'claims' | 'items' | 'settings'>('claims');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [customNoteModal, setCustomNoteModal] = useState<{
    claimId: string;
    itemId?: string;
    action: 'approve' | 'reject';
    title: string;
  } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');

  // Editable settings local form state
  const [formConfig, setFormConfig] = useState<CampusConfig>(config);
  const [newSpotInput, setNewSpotInput] = useState('');
  const [settingsSavedNotice, setSettingsSavedNotice] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setFormConfig(config);
  }, [config]);

  // Stats calculation
  const totalItems = items.length;
  const lostCount = items.filter((i) => i.itemType === 'lost').length;
  const foundCount = items.filter((i) => i.itemType === 'found').length;
  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const returnedCount = items.filter((i) => i.status === 'returned').length;
  const resolutionRate = totalItems > 0 ? Math.round((returnedCount / totalItems) * 100) : 0;

  const handleApproveClick = (claim: ItemClaim) => {
    setAdminNoteInput(
      `Verified. Please present your student ID card at ${formConfig.officeName} to collect your item.`
    );
    setCustomNoteModal({
      claimId: claim.id,
      itemId: claim.itemId,
      action: 'approve',
      title: `Approve Claim for: ${claim.itemTitle}`,
    });
  };

  const handleRejectClick = (claim: ItemClaim) => {
    setAdminNoteInput(
      'Insufficient proof provided. Please provide additional identifying details or serial numbers.'
    );
    setCustomNoteModal({
      claimId: claim.id,
      itemId: claim.itemId,
      action: 'reject',
      title: `Reject Claim for: ${claim.itemTitle}`,
    });
  };

  const handleConfirmDecision = async () => {
    if (!customNoteModal) return;
    try {
      setProcessingId(customNoteModal.claimId);
      const newStatus: ClaimStatus = customNoteModal.action === 'approve' ? 'approved' : 'rejected';

      if (auth.currentUser && !customNoteModal.claimId.startsWith('demo_')) {
        await updateClaimStatus(
          customNoteModal.claimId,
          newStatus,
          adminNoteInput,
          auth.currentUser.uid,
          customNoteModal.itemId
        );
      } else {
        const target = claims.find((c) => c.id === customNoteModal.claimId);
        if (target) {
          target.status = newStatus;
          target.adminNotes = adminNoteInput;
        }
      }

      if (newStatus === 'approved') {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#A3E7C3', '#D8CEF6', '#BAE0FD'],
        });
      }
      setCustomNoteModal(null);
    } catch (err) {
      console.error('Error updating claim status:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkClaimReturned = async (claim: ItemClaim) => {
    try {
      setProcessingId(claim.id);
      if (auth.currentUser && !claim.id.startsWith('demo_')) {
        await updateClaimStatus(
          claim.id,
          'returned',
          'Item handed over in person to verified claimant.',
          auth.currentUser.uid,
          claim.itemId
        );
      } else {
        claim.status = 'returned';
        claim.adminNotes = 'Item handed over in person to verified claimant.';
      }
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#A3E7C3', '#D8CEF6', '#FFCAB0', '#FDC2D6'],
      });
    } catch (err) {
      console.error('Error marking returned:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSeedMoreItems = async () => {
    try {
      setSeedingLoading(true);
      setSeedNotice('');
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) {
        setSeedNotice('Sign in with Google to push records directly to live Firestore.');
        return;
      }
      for (const item of SAMPLE_CAMPUS_ITEMS) {
        await createItem({
          ...item,
          reportedBy: currentUid,
          reportedByName: user?.displayName || 'Campus Desk Staff',
          reportedByEmail: user?.email || '',
        });
      }
      setSeedNotice('Successfully seeded 6 campus lost & found records to Firestore!');
      setTimeout(() => setSeedNotice(''), 4000);
    } catch (err) {
      console.error('Seed error:', err);
      setSeedNotice('Notice: Seeding completed or throttled.');
    } finally {
      setSeedingLoading(false);
    }
  };

  const handleItemStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    try {
      await updateItem(itemId, { status: newStatus });
      if (newStatus === 'returned') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5 },
        });
      }
    } catch (err) {
      console.error('Error changing item status:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      await deleteItem(itemId);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Drop-off spot management
  const handleAddDropOffSpot = () => {
    if (!newSpotInput.trim()) return;
    setFormConfig((prev) => ({
      ...prev,
      dropOffSpots: [...(prev.dropOffSpots || []), newSpotInput.trim()],
    }));
    setNewSpotInput('');
  };

  const handleRemoveDropOffSpot = (indexToRemove: number) => {
    setFormConfig((prev) => ({
      ...prev,
      dropOffSpots: prev.dropOffSpots.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSavedNotice('');
      await onSaveConfig(formConfig);
      setSettingsSavedNotice('Campus settings and drop-off spots saved successfully!');
      setTimeout(() => setSettingsSavedNotice(''), 4000);
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left">
      {/* Header: Lavender + Soft Charcoal Theme */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#EDE9FE] via-[#E2E8F0] to-[#1E293B] p-6 sm:p-10 border border-[#CBD5E1] shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-[#1E293B] mb-3 shadow-xs border border-white">
              <Shield className="w-4 h-4 text-[#4F46E5]" />
              <span>Campus Reclaim Administration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#334155] font-medium mt-1 leading-relaxed">
              Verify student claims, review proof details, manage catalog items, and customize
              campus drop-off locations and office contact information.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {!isAdmin && (
              <button
                onClick={() => signInDemo('admin')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                <span>Switch to Admin View</span>
              </button>
            )}

            <button
              onClick={handleSeedMoreItems}
              disabled={seedingLoading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-[#1E293B] border border-[#CBD5E1] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <span>{seedingLoading ? 'Seeding...' : 'Seed Sample Items'}</span>
            </button>
          </div>
        </div>

        {seedNotice && (
          <div className="mt-4 p-2.5 rounded-xl bg-[#D1FAE5] text-[#065F46] text-xs font-bold border border-[#A7F3D0]">
            {seedNotice}
          </div>
        )}

        {/* 5 Stats Cards in Soft Charcoal + Lavender Accent */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Total Cataloged
            </span>
            <p className="text-2xl font-black text-[#1E293B] mt-1">{totalItems}</p>
            <p className="text-[10px] text-[#475569]">
              {lostCount} Lost • {foundCount} Found
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping"></span>
              Pending Claims
            </span>
            <p className="text-2xl font-black text-[#B45309] mt-1">{pendingClaims.length}</p>
            <p className="text-[10px] text-[#64748B]">Awaiting verification</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
              Total Reunited
            </span>
            <p className="text-2xl font-black text-[#047857] mt-1">{returnedCount}</p>
            <p className="text-[10px] text-[#64748B]">Returned to students</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D28D9]">
              Resolution Rate
            </span>
            <p className="text-2xl font-black text-[#5B21B6] mt-1">{resolutionRate}%</p>
            <p className="text-[10px] text-[#64748B]">Campus recovery rate</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-white/80 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#334155]">
              Office Desk
            </span>
            <p className="text-sm font-black text-[#0F172A] mt-1 truncate">
              {formConfig.officeName || 'Campus Desk'}
            </p>
            <p className="text-[10px] text-[#059669] font-bold truncate">
              {formConfig.officeHours || 'Operating Hours'}
            </p>
          </div>
        </div>
      </section>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-[#CBD5E1] pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'claims'
              ? 'bg-[#1E293B] text-white shadow-md'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-white'
          }`}
        >
          <FileCheck className="w-4 h-4 text-[#818CF8]" />
          <span>Claims Verification Queue</span>
          {pendingClaims.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F59E0B] text-black font-extrabold">
              {pendingClaims.length} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'items'
              ? 'bg-[#1E293B] text-white shadow-md'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-white'
          }`}
        >
          <Shield className="w-4 h-4 text-[#34D399]" />
          <span>Catalog & Inventory ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'settings'
              ? 'bg-[#1E293B] text-white shadow-md'
              : 'text-[#475569] hover:text-[#0F172A] hover:bg-white'
          }`}
        >
          <Settings className="w-4 h-4 text-[#A78BFA]" />
          <span>Campus Settings & Locations</span>
        </button>
      </div>

      {/* Tab 1: Claims Verification Queue */}
      {activeTab === 'claims' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1E293B]">
              Submitted Ownership Claims ({claims.length})
            </h2>
            <span className="text-xs text-[#64748B]">
              Compare claimant proof with item details
            </span>
          </div>

          {claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map((claim) => {
                const item = items.find((i) => i.id === claim.itemId);
                const isPending = claim.status === 'pending';
                const isApproved = claim.status === 'approved';
                const isReturned = claim.status === 'returned';

                return (
                  <div
                    key={claim.id}
                    className={`p-6 rounded-3xl bg-white border transition-all ${
                      isPending
                        ? 'border-[#FDE68A] shadow-md ring-1 ring-[#F59E0B]/20'
                        : 'border-[#E2E8F0] shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
                            isPending
                              ? 'bg-[#FEF3C7] text-[#B45309]'
                              : isApproved
                              ? 'bg-[#D1FAE5] text-[#065F46]'
                              : isReturned
                              ? 'bg-[#EDE9FE] text-[#6D28D9]'
                              : 'bg-[#FFE4E6] text-[#9F1239]'
                          }`}
                        >
                          {isPending ? '⏳' : isApproved ? '✅' : isReturned ? '✨' : '❌'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base text-[#1E293B]">
                              {claim.itemTitle}
                            </h3>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isPending
                                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                  : isApproved
                                  ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                                  : isReturned
                                  ? 'bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]'
                                  : 'bg-[#FFE4E6] text-[#9F1239] border border-[#FECDD3]'
                              }`}
                            >
                              {claim.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B]">
                            Claimant: <strong className="text-[#1E293B]">{claim.claimantName}</strong>{' '}
                            ({claim.claimantEmail}) {claim.claimantPhone && `• ${claim.claimantPhone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveClick(claim)}
                              disabled={processingId === claim.id}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-xs transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Claim</span>
                            </button>
                            <button
                              onClick={() => handleRejectClick(claim)}
                              disabled={processingId === claim.id}
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#9F1239] border border-[#FECDD3] transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleMarkClaimReturned(claim)}
                            disabled={processingId === claim.id}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Mark Reunited & Handed Over</span>
                          </button>
                        )}

                        {item && (
                          <button
                            onClick={() => onSelectItem(item)}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] text-xs font-semibold"
                          >
                            View Item
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
                      <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2E8F0]">
                        <h4 className="font-bold uppercase tracking-wider text-[#64748B] mb-1">
                          Claimant's Proof of Ownership:
                        </h4>
                        <p className="text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                          {claim.proofDetails}
                        </p>
                        {claim.proofImageUrl && (
                          <div className="mt-3">
                            <span className="text-[10px] font-bold text-[#64748B] block mb-1">
                              Attached Photo Proof:
                            </span>
                            <img
                              src={claim.proofImageUrl}
                              alt="Claim proof"
                              className="w-32 h-24 object-cover rounded-xl border border-[#CBD5E1]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl bg-[#EDE9FE]/40 border border-[#DDD6FE]">
                        <h4 className="font-bold uppercase tracking-wider text-[#6D28D9] mb-1">
                          Item Record:
                        </h4>
                        <p className="text-[#334155] mb-2">
                          Location: <strong>{item?.location || 'Campus'}</strong> • Date:{' '}
                          {item?.incidentDate}
                        </p>
                        {item?.securityQuestion && (
                          <div className="p-2.5 rounded-xl bg-white border border-[#DDD6FE] mb-2">
                            <span className="font-bold text-[#6D28D9] block text-[11px]">
                              🔐 Security Question Prompt:
                            </span>
                            <span className="text-xs text-[#4C1D95]">
                              "{item.securityQuestion}"
                            </span>
                          </div>
                        )}

                        {claim.adminNotes && (
                          <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                            <span className="font-bold text-[#166534] block text-[11px]">
                              Officer Instructions:
                            </span>
                            <span className="text-xs text-[#065F46]">{claim.adminNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-[#E2E8F0] text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto" />
              <h3 className="font-bold text-base text-[#1E293B]">Verification Queue Clear</h3>
              <p className="text-xs text-[#64748B]">
                No pending claim requests right now. As students claim items, they appear here for review.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Catalog & Inventory Management */}
      {activeTab === 'items' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1E293B]">All Cataloged Items ({items.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter catalog..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-xs outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3.5 px-4">Item Details</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Reporter</th>
                    <th className="py-3.5 px-4">Status Action</th>
                    <th className="py-3.5 px-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {items
                    .filter((i) =>
                      searchTerm === '' ||
                      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      i.location.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-10 h-10 rounded-xl object-cover border border-[#E2E8F0]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-base">
                                📦
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#1E293B] line-clamp-1">{item.title}</p>
                              <span className="text-[10px] text-[#64748B]">
                                {item.category} • {item.incidentDate}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.itemType === 'lost'
                                ? 'bg-[#FFE5D9] text-[#9A3412]'
                                : 'bg-[#D8F5E5] text-[#065F46]'
                            }`}
                          >
                            {item.itemType.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#475569]">{item.location}</td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {item.reportedByName || 'Student'}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleItemStatusChange(item.id, e.target.value as ItemStatus)
                            }
                            className="px-2 py-1 rounded-lg bg-white border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] outline-none"
                          >
                            <option value="open">Open / Active</option>
                            <option value="claimed">Under Claim</option>
                            <option value="returned">Reunited ✨</option>
                            <option value="closed">Closed / Archived</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onSelectItem(item)}
                              className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6D28D9]"
                              title="View"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-[#FFE4E6] text-[#DC2626]"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Configurable Campus Drop-off Spots & Safety Contact (Requirements 4 & 5) */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                Campus Drop-Off Spots & Office Contact Configuration
              </h2>
              <p className="text-xs text-[#64748B]">
                Configure real drop-off locations and campus contact information for your college.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#7C3AED] hover:from-[#047857] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Saving...' : 'Save Campus Settings'}</span>
            </button>
          </div>

          {settingsSavedNotice && (
            <div className="p-3 rounded-2xl bg-[#D1FAE5] text-[#065F46] text-xs font-bold border border-[#A7F3D0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{settingsSavedNotice}</span>
            </div>
          )}

          {/* Section: Campus Drop-off Spots */}
          <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#059669]" />
                <h3 className="font-bold text-base text-[#1E293B]">
                  Configurable Campus Drop-off Spots
                </h3>
              </div>
              <span className="text-xs text-[#64748B]">
                {formConfig.dropOffSpots?.length || 0} spots registered
              </span>
            </div>

            <p className="text-xs text-[#475569]">
              These spots will be shown to students across the footer, report forms, and collection directions.
            </p>

            {/* Current Drop-off Spots List */}
            <div className="space-y-2">
              {formConfig.dropOffSpots?.map((spot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2E8F0] text-xs font-semibold text-[#1E293B]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-xl bg-[#D8F5E5] text-[#065F46] flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span>{spot}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDropOffSpot(idx)}
                    className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FFE4E6] transition-colors"
                    title="Remove spot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Drop-off Spot */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newSpotInput}
                onChange={(e) => setNewSpotInput(e.target.value)}
                placeholder="Enter new campus drop-off location (e.g. Student Center Reception, Library Desk)..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
              />
              <button
                type="button"
                onClick={handleAddDropOffSpot}
                className="px-4 py-2.5 rounded-2xl bg-[#E8E2F8] hover:bg-[#D8CEF6] text-[#6D28D9] border border-[#D8CEF6] text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Spot</span>
              </button>
            </div>
          </div>

          {/* Section: Campus Safety & Office Contact Configuration */}
          <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-base text-[#1E293B]">
                Campus Contact & Operating Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Office or Department Name
                </label>
                <input
                  type="text"
                  value={formConfig.officeName}
                  onChange={(e) =>
                    setFormConfig((prev) => ({ ...prev, officeName: e.target.value }))
                  }
                  placeholder="e.g. Campus Reclaim Office"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Desk Location on Campus
                </label>
                <input
                  type="text"
                  value={formConfig.locationInfo}
                  onChange={(e) =>
                    setFormConfig((prev) => ({ ...prev, locationInfo: e.target.value }))
                  }
                  placeholder="e.g. Student Services Building, Room 102"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Contact Email
                </label>
                <input
                  type="text"
                  value={formConfig.contactEmail}
                  onChange={(e) =>
                    setFormConfig((prev) => ({ ...prev, contactEmail: e.target.value }))
                  }
                  placeholder="e.g. lostandfound@college.edu"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Contact Phone / Extension
                </label>
                <input
                  type="text"
                  value={formConfig.contactPhone}
                  onChange={(e) =>
                    setFormConfig((prev) => ({ ...prev, contactPhone: e.target.value }))
                  }
                  placeholder="e.g. (College Extension) or Available via Student Services"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Office Hours
                </label>
                <input
                  type="text"
                  value={formConfig.officeHours}
                  onChange={(e) =>
                    setFormConfig((prev) => ({ ...prev, officeHours: e.target.value }))
                  }
                  placeholder="e.g. Monday – Friday: 9:00 AM – 5:00 PM"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Item Pickup Instructions
                </label>
                <input
                  type="text"
                  value={formConfig.pickupInstructions}
                  onChange={(e) =>
                    setFormConfig((prev) => ({ ...prev, pickupInstructions: e.target.value }))
                  }
                  placeholder="e.g. Please present valid student ID card when collecting items."
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Decision modal for notes */}
      {customNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setCustomNoteModal(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#CBD5E1] z-10 space-y-4">
            <h3 className="font-extrabold text-lg text-[#1E293B]">{customNoteModal.title}</h3>
            <div>
              <label className="block text-xs font-bold text-[#64748B] uppercase mb-1">
                {customNoteModal.action === 'approve'
                  ? 'Pickup Instructions for Student Claimant'
                  : 'Reason for Rejection'}
              </label>
              <textarea
                rows={3}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                className="w-full p-3 rounded-2xl border border-[#CBD5E1] text-xs font-medium text-[#1E293B] outline-none focus:border-[#7C3AED]"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCustomNoteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#475569] hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                  customNoteModal.action === 'approve' ? 'bg-[#059669]' : 'bg-[#E11D48]'
                }`}
              >
                Confirm {customNoteModal.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
