import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { auth } from './firebase/config';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LostItemsPage } from './pages/LostItemsPage';
import { FoundItemsPage } from './pages/FoundItemsPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { AdminPage } from './pages/AdminPage';
import { BrowseItemsPage } from './pages/BrowseItemsPage';
import { ReportItemModal } from './components/ReportItemModal';
import { ClaimItemModal } from './components/ClaimItemModal';
import { ItemDetailsModal } from './components/ItemDetailsModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { VerifyHandoverModal } from './components/VerifyHandoverModal';
import { LostFoundItem, ItemClaim, PageView, ItemType, AppNotification } from './types';
import { subscribeItems } from './firebase/items';
import { subscribeAllClaims, subscribeUserClaims } from './firebase/claims';
import {
  subscribeUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendNotification,
} from './firebase/notifications';
import { findSimilarItems } from './utils/matchingEngine';
import {
  CampusConfig,
  DEFAULT_CAMPUS_CONFIG,
  subscribeCampusConfig,
  saveCampusConfig,
} from './firebase/settings';
import { Sparkles, X } from 'lucide-react';


const INITIAL_DEMO_CLAIMS: ItemClaim[] = [
  {
    id: 'demo_claim_1',
    itemId: 'sample_1',
    itemTitle: 'Wireless Earbuds with Charging Case',
    claimantId: 'student_member_1',
    claimantName: 'Campus Student',
    claimantEmail: 'student@campus.portal',
    claimantPhone: '',
    proofDetails:
      'Green protective case cover. Bluetooth pairing device name matches my student profile.',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'demo_claim_2',
    itemId: 'sample_3',
    itemTitle: 'Scientific Graphing Calculator',
    claimantId: 'student_member_2',
    claimantName: 'Student Member',
    claimantEmail: 'student2@campus.portal',
    claimantPhone: '',
    proofDetails:
      'Inside the sliding cover, my initials are marked in permanent ink.',
    status: 'approved',
    adminNotes: 'Ownership verified against student record. Kept at designated campus security drop-off point.',
    reviewedBy: 'Campus Administrator',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 36000000).toISOString(),
  },
];

function MainApp() {
  const { user, profile, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [claims, setClaims] = useState<ItemClaim[]>(INITIAL_DEMO_CLAIMS);
  const [loadingItems, setLoadingItems] = useState(true);

  const [campusConfig, setCampusConfig] = useState<CampusConfig>(DEFAULT_CAMPUS_CONFIG);

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState<ItemType>('lost');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<LostFoundItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<LostFoundItem | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  // In-app notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Real-time Firestore items subscription (public read)
  useEffect(() => {
    const unsubscribe = subscribeItems(
      (newItems) => {
        setItems(newItems);
        setLoadingItems(false);
      },
      (err) => {
        console.warn('Real-time items listener error:', err);
        setLoadingItems(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore campus configuration subscription
  useEffect(() => {
    const unsub = subscribeCampusConfig((cfg) => {
      setCampusConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Real-time claims subscription (guarded: only attached when REAL auth.currentUser exists)
  useEffect(() => {
    const realUser = auth.currentUser;
    if (realUser) {
      if (isAdmin) {
        const unsub = subscribeAllClaims(
          (allClaims) => setClaims(allClaims),
          (err) => console.warn('Admin claims listener error:', err)
        );
        return () => unsub();
      } else {
        const unsub = subscribeUserClaims(
          realUser.uid,
          (userClaims) => setClaims(userClaims),
          (err) => console.warn('User claims listener error:', err)
        );
        return () => unsub();
      }
    } else {
      // In Demo / preview mode, maintain demo claims
      setClaims(INITIAL_DEMO_CLAIMS);
    }
  }, [user, isAdmin]);

  // Real-time notifications listener
  useEffect(() => {
    const targetUserId = user?.uid || 'student_member_uid';
    const unsub = subscribeUserNotifications(
      targetUserId,
      (list) => setNotifications(list),
      (err) => console.warn('Notifications listener error:', err)
    );
    return () => unsub();
  }, [user]);

  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllNotificationsRead = async () => {
    const targetUserId = user?.uid || 'student_member_uid';
    await markAllNotificationsAsRead(targetUserId);
  };

  const handleSaveCampusConfig = async (newConfig: CampusConfig) => {
    try {
      await saveCampusConfig(newConfig);
      setCampusConfig(newConfig);
      showToast('Campus drop-off spots and contact configuration updated!');
    } catch (err) {
      console.error('Failed to save campus settings:', err);
      showToast('Error updating campus configuration.');
    }
  };

  const handleOpenReportModal = (type: 'lost' | 'found') => {
    setReportModalType(type);
    setReportModalOpen(true);
  };

  const handleOpenClaimModal = (item: LostFoundItem) => {
    setSelectedItemForClaim(item);
    setClaimModalOpen(true);
  };

  const handleSelectItem = (item: LostFoundItem) => {
    setSelectedItemForDetails(item);
    setDetailsModalOpen(true);
  };

  const handleReportSuccess = (newItemId: string) => {
    showToast(
      reportModalType === 'lost'
        ? 'Your lost item report has been published to the campus registry!'
        : 'Thank you! Your found item submission has been safely registered.'
    );
    // Check for potential matching candidates
    if (reportModalType === 'lost') {
      setTimeout(() => {
        showToast('🔍 AI Matching Engine: Check your Student Dashboard for potential found matches!');
      }, 2500);
    }
  };

  const handleClaimSubmitted = async (claimId: string) => {
    // If in demo mode, update local claims state
    if (!auth.currentUser && selectedItemForClaim) {
      const newDemoClaim: ItemClaim = {
        id: claimId,
        itemId: selectedItemForClaim.id,
        itemTitle: selectedItemForClaim.title,
        claimantId: user?.uid || 'student_demo',
        claimantName: profile?.displayName || user?.displayName || 'Campus Student',
        claimantEmail: profile?.email || user?.email || 'student@campus.portal',
        claimantPhone: profile?.phone || '',
        proofDetails: 'Claim submitted for item recovery verification',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setClaims((prev) => [newDemoClaim, ...prev]);
    }

    // Send notification to the reporter
    if (selectedItemForClaim && selectedItemForClaim.reportedBy) {
      await sendNotification({
        userId: selectedItemForClaim.reportedBy,
        type: 'claim_received',
        title: 'New Ownership Claim Submitted',
        message: `A student has filed a recovery claim for: "${selectedItemForClaim.title}".`,
        itemId: selectedItemForClaim.id,
        claimId,
      }).catch((e) => console.warn('Notification deferred:', e));
    }

    showToast('Your ownership claim has been submitted for verification.');
    setCurrentPage('claims');
  };

  const lostCount = items.filter((i) => i.itemType === 'lost' && i.status === 'open').length;
  const foundCount = items.filter((i) => i.itemType === 'found' && i.status === 'open').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E293B] antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1E293B] text-white shadow-2xl border border-slate-700 animate-bounce text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-[#A3E7C3]" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenReportModal={handleOpenReportModal}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenVerifyModal={() => setVerifyModalOpen(true)}
        lostCount={lostCount}
        foundCount={foundCount}
        claimsCount={claims.length}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />


      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        {loadingItems && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-12 h-12 rounded-full border-3 border-[#D8CEF6] border-t-[#7C3AED] animate-spin"></div>
            <p className="text-xs font-bold text-[#6D28D9] animate-pulse">
              Connecting to Campus Reclaim database...
            </p>
          </div>
        ) : (
          <>
            {currentPage === 'home' && (
              <HomePage
                items={items}
                onNavigate={setCurrentPage}
                onSelectItem={handleSelectItem}
                onClaimItem={handleOpenClaimModal}
                onOpenReportModal={handleOpenReportModal}
              />
            )}

            {currentPage === 'browse' && (
              <BrowseItemsPage
                items={items}
                onSelectItem={handleSelectItem}
                onClaimItem={handleOpenClaimModal}
                onOpenReportModal={handleOpenReportModal}
              />
            )}

            {currentPage === 'dashboard' && (
              <DashboardPage
                items={items}
                userClaims={claims}
                onNavigate={setCurrentPage}
                onSelectItem={handleSelectItem}
                onClaimItem={handleOpenClaimModal}
                onOpenReportModal={handleOpenReportModal}
                onOpenProfileModal={() => setProfileModalOpen(true)}
                config={campusConfig}
              />
            )}

            {currentPage === 'lost' && (
              <LostItemsPage
                items={items}
                onSelectItem={handleSelectItem}
                onOpenReportModal={handleOpenReportModal}
              />
            )}

            {currentPage === 'found' && (
              <FoundItemsPage
                items={items}
                onSelectItem={handleSelectItem}
                onClaimItem={handleOpenClaimModal}
                onOpenReportModal={handleOpenReportModal}
              />
            )}

            {currentPage === 'claims' && (
              <ClaimsPage
                claims={claims}
                items={items}
                onNavigate={setCurrentPage}
                onSelectItem={handleSelectItem}
                config={campusConfig}
              />
            )}

            {currentPage === 'admin' && (
              <AdminPage
                claims={claims}
                items={items}
                onSelectItem={handleSelectItem}
                config={campusConfig}
                onSaveConfig={handleSaveCampusConfig}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenReportModal={handleOpenReportModal}
        config={campusConfig}
      />

      {/* Modals */}
      <ReportItemModal
        isOpen={reportModalOpen}
        initialType={reportModalType}
        onClose={() => setReportModalOpen(false)}
        onSuccess={handleReportSuccess}
      />

      <ClaimItemModal
        isOpen={claimModalOpen}
        item={selectedItemForClaim}
        onClose={() => {
          setClaimModalOpen(false);
          setSelectedItemForClaim(null);
        }}
        onClaimSubmitted={handleClaimSubmitted}
      />

      <ItemDetailsModal
        isOpen={detailsModalOpen}
        item={selectedItemForDetails}
        allItems={items}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedItemForDetails(null);
        }}
        onClaim={(item) => {
          setDetailsModalOpen(false);
          handleOpenClaimModal(item);
        }}
        onSelectSimilarItem={(simItem) => {
          handleSelectItem(simItem);
        }}
      />

      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => showToast('Student account authenticated!')}
      />

      <VerifyHandoverModal
        isOpen={verifyModalOpen}
        claims={claims}
        items={items}
        onClose={() => setVerifyModalOpen(false)}
        onSuccess={(claimId) => {
          showToast('Handover verified and marked as recovered!');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
