import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, saveUserProfile, checkIsAdmin, ADMIN_BOOTSTRAP_EMAIL } from '../firebase/users';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemo: (role: 'student' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (details: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const isUserAdmin = await checkIsAdmin(currentUser);
          setIsAdmin(isUserAdmin);

          let userProf = await getUserProfile(currentUser.uid);
          if (!userProf) {
            // Initialize default profile
            userProf = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Campus Member',
              email: currentUser.email || '',
              role: isUserAdmin ? 'admin' : 'student',
              campusId: 'STU-' + Math.floor(100000 + Math.random() * 900000),
              department: 'General Studies',
              phone: currentUser.phoneNumber || '',
            };
            await saveUserProfile(userProf);
          }
          setProfile(userProf);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // Normal user action - popup closed
        return;
      }
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Demo sign-in for preview/testing without blocking
  const signInDemo = async (role: 'student' | 'admin') => {
    const isMockAdmin = role === 'admin';
    const mockEmail = isMockAdmin ? ADMIN_BOOTSTRAP_EMAIL : 'student@college.edu';
    const mockUid = isMockAdmin ? 'admin_test_uid' : 'student_member_uid';

    const mockProfile: UserProfile = {
      uid: mockUid,
      displayName: isMockAdmin ? 'Campus Administrator' : 'Student Member',
      email: mockEmail,
      role: isMockAdmin ? 'admin' : 'student',
      campusId: isMockAdmin ? 'ADMIN-01' : 'STU-1001',
      department: isMockAdmin ? 'Campus Reclaim' : 'College Department',
      phone: '',
    };

    // Synthesize user object
    const syntheticUser = {
      uid: mockUid,
      email: mockEmail,
      displayName: mockProfile.displayName,
      emailVerified: true,
      isAnonymous: false,
      photoURL: isMockAdmin
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    } as unknown as User;

    setUser(syntheticUser);
    setProfile(mockProfile);
    setIsAdmin(isMockAdmin);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('SignOut warning:', err);
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const updateProfile = async (details: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...details };
    setProfile(updated);
    if (user?.uid && !user.uid.includes('_test_uid')) {
      await saveUserProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signInWithGoogle,
        signInDemo,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
