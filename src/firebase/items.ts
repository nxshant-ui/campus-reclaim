import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { LostFoundItem } from '../types';

const ITEMS_COLLECTION = 'items';

// Preset realistic campus items to seed database if empty
export const SAMPLE_CAMPUS_ITEMS: Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Wireless Earbuds in Green Protective Case',
    description: 'Found on a study desk in the Library. Earbuds and case are in good condition.',
    itemType: 'found',
    category: 'electronics',
    location: 'Campus Library',
    incidentDate: 'Today, Morning',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
    contactName: 'Campus Help Desk',
    contactEmail: '',
    contactPhone: '',
    reportedBy: 'system_security_officer',
    reportedByName: 'Campus Help Desk',
    reportedByEmail: '',
    securityQuestion: 'What Bluetooth device name or sticker is associated with this case?',
  },
  {
    title: 'Blue Insulated Water Bottle',
    description: 'Lost between the Student Center and Academic Block. Features several outdoor stickers.',
    itemType: 'lost',
    category: 'water_bottles',
    location: 'Student Center',
    incidentDate: 'Yesterday, Afternoon',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    contactName: 'Student Member',
    contactEmail: '',
    contactPhone: '',
    reportedBy: 'student_member',
    reportedByName: 'Student Member',
    reportedByEmail: '',
    securityQuestion: 'What stickers are placed around the base of the bottle?',
  },
  {
    title: 'Scientific Graphing Calculator',
    description: 'Found left behind on a lecture hall desk following afternoon classes.',
    itemType: 'found',
    category: 'electronics',
    location: 'Lecture Hall Block',
    incidentDate: 'Yesterday, 11:30 AM',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
    contactName: 'Department Office',
    contactEmail: '',
    contactPhone: '',
    reportedBy: 'system_security_officer',
    reportedByName: 'Department Office',
    reportedByEmail: '',
    securityQuestion: 'What model number or markings are on the inside of the slide cover?',
  },
  {
    title: 'Black Leather Wallet',
    description: 'Lost wallet near the cafeteria area containing student ID and transit card.',
    itemType: 'lost',
    category: 'id_cards',
    location: 'Campus Cafeteria',
    incidentDate: '2 days ago',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    contactName: 'Student Member',
    contactEmail: '',
    contactPhone: '',
    reportedBy: 'student_member',
    reportedByName: 'Student Member',
    reportedByEmail: '',
    securityQuestion: 'What name or ID initials appear on the card inside?',
  },
  {
    title: 'Set of Keys with Fabric Lanyard',
    description: 'Found near the campus bicycle parking area. Contains three keys and a small tag.',
    itemType: 'found',
    category: 'keys',
    location: 'Bicycle Parking Area',
    incidentDate: '3 days ago',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    contactName: 'Campus Reception Desk',
    contactEmail: '',
    contactPhone: '',
    reportedBy: 'system_security_officer',
    reportedByName: 'Campus Reception Desk',
    reportedByEmail: '',
    securityQuestion: 'What color and design is on the lanyard fabric?',
  },
  {
    title: 'Dark Lightweight Windbreaker Jacket',
    description: 'Left behind on a bench in the sports facility changing area.',
    itemType: 'found',
    category: 'clothing',
    location: 'Campus Sports Center',
    incidentDate: '4 days ago',
    status: 'open',
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    contactName: 'Sports Center Desk',
    contactEmail: '',
    contactPhone: '',
    reportedBy: 'system_security_officer',
    reportedByName: 'Sports Center Desk',
    reportedByEmail: '',
    securityQuestion: 'What brand and size tag is labeled inside the collar?',
  },
];

export function subscribeItems(
  onData: (items: LostFoundItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const itemsRef = collection(db, ITEMS_COLLECTION);
  const q = query(itemsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: LostFoundItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          itemType: data.itemType || 'lost',
          category: data.category || 'other',
          location: data.location || '',
          incidentDate: data.incidentDate || '',
          status: data.status || 'open',
          imageUrl: data.imageUrl || '',
          contactName: data.contactName || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          reportedBy: data.reportedBy || '',
          reportedByName: data.reportedByName || '',
          reportedByEmail: data.reportedByEmail || '',
          securityQuestion: data.securityQuestion || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      // If no items in Firestore yet, show default campus catalog items
      if (items.length === 0) {
        const sampleWithIds: LostFoundItem[] = SAMPLE_CAMPUS_ITEMS.map((sample, idx) => ({
          ...sample,
          id: `sample_${idx + 1}`,
          createdAt: new Date(Date.now() - idx * 3600000).toISOString(),
          updatedAt: new Date(Date.now() - idx * 3600000).toISOString(),
        }));
        onData(sampleWithIds);
      } else {
        onData(items);
      }
    },
    (error) => {
      console.warn('Items listener warning:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

export async function createItem(
  item: Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt'>,
  customId?: string
): Promise<string> {
  const id = customId || 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const docRef = doc(db, ITEMS_COLLECTION, id);
  const now = new Date().toISOString();

  const payload = {
    ...item,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ITEMS_COLLECTION}/${id}`);
  }
}

export async function updateItem(
  itemId: string,
  updates: Partial<Omit<LostFoundItem, 'id' | 'createdAt'>>
): Promise<void> {
  // If editing a local sample item, return without error
  if (itemId.startsWith('sample_')) {
    return;
  }
  const docRef = doc(db, ITEMS_COLLECTION, itemId);
  try {
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ITEMS_COLLECTION}/${itemId}`);
  }
}

export async function deleteItem(itemId: string): Promise<void> {
  if (itemId.startsWith('sample_')) {
    return;
  }
  const docRef = doc(db, ITEMS_COLLECTION, itemId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ITEMS_COLLECTION}/${itemId}`);
  }
}

export async function checkAndSeedInitialItems(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // Do not attempt unauthenticated write to Firestore
    return;
  }
  try {
    const itemsRef = collection(db, ITEMS_COLLECTION);
    const snap = await getDocs(itemsRef);
    if (snap.empty) {
      console.log('Seeding initial campus lost & found items with user credentials...');
      for (let i = 0; i < SAMPLE_CAMPUS_ITEMS.length; i++) {
        const item = {
          ...SAMPLE_CAMPUS_ITEMS[i],
          reportedBy: currentUser.uid,
          reportedByName: currentUser.displayName || 'Campus Officer',
          reportedByEmail: currentUser.email || 'security@campus.edu',
        };
        const seedId = `campus_item_${i + 1}`;
        await createItem(item, seedId);
      }
    }
  } catch (error) {
    console.warn('Initial seeding skipped:', error);
  }
}
