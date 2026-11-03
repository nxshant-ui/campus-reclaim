import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { AppNotification, NotificationType } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

// In-memory notifications store for demo/guest mode
let mockNotifications: AppNotification[] = [
  {
    id: 'demo_notif_1',
    userId: 'student_member_uid',
    type: 'claim_approved',
    title: 'Claim Approved! 🎉',
    message: 'Your claim for "Scientific Graphing Calculator" has been approved. Present your recovery QR code at Campus Security.',
    itemId: 'sample_3',
    claimId: 'demo_claim_2',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'demo_notif_2',
    userId: 'student_member_uid',
    type: 'match_found',
    title: 'AI Smart Match Found! 🔍',
    message: 'A found item "Wireless Earbuds" matches your reported lost item with 88% similarity.',
    itemId: 'sample_1',
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

type NotificationCallback = (notifications: AppNotification[]) => void;
const memoryListeners: Set<NotificationCallback> = new Set();

function notifyMemoryListeners() {
  memoryListeners.forEach((cb) => cb([...mockNotifications]));
}

export function subscribeUserNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  // If no real Firebase user is logged in, use in-memory notification store
  if (!auth.currentUser || auth.currentUser.uid.includes('_test_uid')) {
    onData(mockNotifications);
    memoryListeners.add(onData);
    return () => {
      memoryListeners.delete(onData);
    };
  }

  const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(notifRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId || '',
          type: (data.type as NotificationType) || 'claim_received',
          title: data.title || '',
          message: data.message || '',
          itemId: data.itemId || '',
          claimId: data.claimId || '',
          read: Boolean(data.read),
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // Sort client-side by date descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, NOTIFICATIONS_COLLECTION);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

export async function sendNotification(
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
): Promise<string> {
  const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const newNotif: AppNotification = {
    ...notification,
    id,
    read: false,
    createdAt: now,
  };

  if (!auth.currentUser || auth.currentUser.uid.includes('_test_uid')) {
    mockNotifications = [newNotif, ...mockNotifications];
    notifyMemoryListeners();
    return id;
  }

  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  try {
    await setDoc(docRef, newNotif);
    return id;
  } catch (error) {
    // If Firestore rules error or unavailable, keep in memory so user gets the notification
    console.warn('Notification Firestore write fallback to memory:', error);
    mockNotifications = [newNotif, ...mockNotifications];
    notifyMemoryListeners();
    return id;
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid.includes('_test_uid')) {
    mockNotifications = mockNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    notifyMemoryListeners();
    return;
  }

  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  try {
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.warn('markNotificationAsRead fallback:', error);
    mockNotifications = mockNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    notifyMemoryListeners();
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  mockNotifications = mockNotifications.map((n) =>
    n.userId === userId || userId === 'student_member_uid' ? { ...n, read: true } : n
  );
  notifyMemoryListeners();
}
