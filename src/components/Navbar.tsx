import React, { useState } from 'react';
import {
  Compass,

  Search,
  PlusCircle,
  FileCheck,
  Shield,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Layers,
  Bell,
  QrCode,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageView, AppNotification } from '../types';
import { NotificationsPopover } from './NotificationsPopover';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
  onOpenProfileModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenVerifyModal?: () => void;
  lostCount: number;
  foundCount: number;
  claimsCount: number;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenReportModal,
  onOpenProfileModal,
  onOpenAuthModal,
  onOpenVerifyModal,
  lostCount,
  foundCount,
  claimsCount,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) => {
  const { user, profile, isAdmin, signInWithGoogle, signInDemo, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;


  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/60 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Portal Brand */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E8E2F8] via-[#FFE4EC] to-[#DDF0FF] p-2.5 shadow-sm border border-white/80 flex items-center justify-center transition-transform group-hover:scale-105">
              <Compass className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-[#6D28D9] via-[#BE185D] to-[#2563EB] bg-clip-text text-transparent">
                  Campus Reclaim
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
                College Item Recovery Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation - Exact Simple Names Requested */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#FAF8F5]/90 p-1 rounded-2xl border border-[#E9E4DC]">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                currentPage === 'home'
                  ? 'bg-gradient-to-r from-[#EDE9FE] to-[#FCE7F3] text-[#6D28D9] shadow-xs'
                  : 'text-[#475569] hover:bg-white hover:text-[#1E293B]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentPage === 'dashboard'
                  ? 'bg-gradient-to-r from-[#D1FAE5] to-[#E0F2FE] text-[#047857] shadow-xs'
                  : 'text-[#475569] hover:bg-white hover:text-[#1E293B]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#059669]" />
              <span>Student Dashboard</span>
            </button>

            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-[#C2410C] hover:bg-[#FFE5D9]/60 transition-all flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Report Lost Item</span>
            </button>

            <button
              onClick={() => onOpenReportModal('found')}
              className="px-3 py-2 rounded-xl text-xs font-bold text-[#15803D] hover:bg-[#D8F5E5]/60 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Report Found Item</span>
            </button>

            <button
              onClick={() => onNavigate('browse')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentPage === 'browse' || currentPage === 'lost' || currentPage === 'found'
                  ? 'bg-gradient-to-r from-[#FFEDD5] to-[#EDE9FE] text-[#6D28D9] shadow-xs'
                  : 'text-[#475569] hover:bg-white hover:text-[#1E293B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Browse Items</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E2E8F0] text-[#475569] font-extrabold">
                {lostCount + foundCount}
              </span>
            </button>

            <button
              onClick={() => onNavigate('claims')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentPage === 'claims'
                  ? 'bg-gradient-to-r from-[#FCE7F3] to-[#EDE9FE] text-[#9D174D] shadow-xs'
                  : 'text-[#475569] hover:bg-white hover:text-[#1E293B]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-[#BE185D]" />
              <span>My Claims</span>
              {claimsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FDC2D6] text-[#831843] font-extrabold">
                  {claimsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentPage === 'admin'
                  ? 'bg-gradient-to-r from-[#EDE9FE] to-[#334155] text-[#1E293B] shadow-xs'
                  : 'text-[#475569] hover:bg-white hover:text-[#1E293B]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#4338CA]" />
              <span>Admin Dashboard</span>
            </button>
          </nav>

          {/* Right Action buttons and user profile */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-2xl bg-white/90 border border-[#E2E8F0] shadow-xs text-[#475569] hover:text-[#1E293B] hover:border-[#CBD5E1] transition-all cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#7C3AED]" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              <NotificationsPopover
                isOpen={notificationsOpen}
                notifications={notifications}
                onClose={() => setNotificationsOpen(false)}
                onMarkAsRead={(id) => onMarkNotificationRead?.(id)}
                onMarkAllAsRead={() => onMarkAllNotificationsRead?.()}
                onSelectNotification={() => {
                  setNotificationsOpen(false);
                  onNavigate('claims');
                }}
              />
            </div>

            {/* Quick QR Verify Handover */}
            {onOpenVerifyModal && (
              <button
                onClick={onOpenVerifyModal}
                title="Verify Handover Pass"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#6D28D9] border border-[#DDD6FE] shadow-2xs transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Verify Pass</span>
              </button>
            )}

            {/* Auth Dropdown / Buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white/90 border border-[#E2E8F0] shadow-xs hover:border-[#CBD5E1] transition-all cursor-pointer"
                >
                  <img
                    src={
                      user.photoURL ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={user.displayName || 'Avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-[#D8CEF6]"
                  />
                  <div className="hidden md:block text-left text-xs leading-tight">
                    <p className="font-bold text-[#1E293B] truncate max-w-[110px]">
                      {user.displayName || profile?.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-[#64748B] font-semibold">
                      {isAdmin ? 'Admin' : 'Student'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#64748B] hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-[#E2E8F0] py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-[#F1F5F9]">
                      <p className="font-bold text-[#1E293B] truncate">
                        {user.displayName || profile?.displayName}
                      </p>
                      <p className="text-xs text-[#64748B] truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8E2F8] text-[#6D28D9]">
                        ID: {profile?.campusId || 'STU-MEMBER'}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenProfileModal();
                        }}
                        className="w-full text-left px-4 py-2 text-[#334155] hover:bg-[#FAF8F5] flex items-center gap-2 text-xs"
                      >
                        <UserIcon className="w-4 h-4 text-[#64748B]" />
                        <span>Student Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('dashboard');
                        }}
                        className="w-full text-left px-4 py-2 text-[#334155] hover:bg-[#FAF8F5] flex items-center gap-2 text-xs"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#64748B]" />
                        <span>Student Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('claims');
                        }}
                        className="w-full text-left px-4 py-2 text-[#334155] hover:bg-[#FAF8F5] flex items-center gap-2 text-xs"
                      >
                        <FileCheck className="w-4 h-4 text-[#64748B]" />
                        <span>My Claims & Recovery</span>
                      </button>

                      {onOpenVerifyModal && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenVerifyModal();
                          }}
                          className="w-full text-left px-4 py-2 text-[#334155] hover:bg-[#FAF8F5] flex items-center gap-2 text-xs"
                        >
                          <QrCode className="w-4 h-4 text-[#7C3AED]" />
                          <span>Verify Handover QR Code</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2 text-[#6D28D9] font-medium hover:bg-[#EDE9FE]/50 flex items-center gap-2 text-xs"
                      >
                        <Shield className="w-4 h-4 text-[#7C3AED]" />
                        <span>Admin Dashboard</span>
                      </button>
                    </div>

                    <div className="border-t border-[#F1F5F9] pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 font-medium text-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white shadow-xs transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Student Login</span>
                </button>

                {/* Quick Switch for testing */}
                <div className="relative group">
                  <button
                    onClick={() => signInDemo('student')}
                    className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#E8E2F8] hover:bg-[#D8CEF6] text-[#6D28D9] border border-[#D8CEF6] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Demo</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="hidden group-hover:block absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-[#E2E8F0] p-1.5 z-50 text-xs">
                    <button
                      onClick={() => signInDemo('student')}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#FAF8F5] text-[#1E293B] font-medium"
                    >
                      🎓 Student Account
                    </button>
                    <button
                      onClick={() => signInDemo('admin')}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#EDE9FE] text-[#6D28D9] font-medium"
                    >
                      🛡️ Admin Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer - Simple Names */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white/95 border-b border-[#E2E8F0] px-4 pt-3 pb-6 space-y-2 text-left">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#F1F5F9]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReportModal('lost');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#FFE5D9] text-[#9A3412] border border-[#FFCAB0]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReportModal('found');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#D8F5E5] text-[#065F46] border border-[#A3E7C3]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Report Found Item</span>
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1E293B] hover:bg-[#FAF8F5]"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#047857] hover:bg-[#D1FAE5]/40 flex items-center justify-between"
            >
              <span>Student Dashboard</span>
            </button>
            <button
              onClick={() => {
                onNavigate('browse');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#6D28D9] hover:bg-[#EDE9FE]/40 flex items-center justify-between"
            >
              <span>Browse Items</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E2E8F0] text-[#1E293B] font-bold">
                {lostCount + foundCount}
              </span>
            </button>
            <button
              onClick={() => {
                onNavigate('claims');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#9D174D] hover:bg-[#FCE7F3]/40 flex items-center justify-between"
            >
              <span>My Claims</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FCE7F3] text-[#831843] font-bold">
                {claimsCount}
              </span>
            </button>
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-[#4338CA] hover:bg-[#EDE9FE]/50 flex items-center justify-between"
            >
              <span>Admin Dashboard</span>
              <Shield className="w-4 h-4 text-[#4338CA]" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
