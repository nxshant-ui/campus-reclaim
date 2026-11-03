import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';

export interface CampusConfig {
  officeName: string;
  dropOffSpots: string[];
  contactEmail: string;
  contactPhone: string;
  officeHours: string;
  locationInfo: string;
  pickupInstructions: string;
}

export const DEFAULT_CAMPUS_CONFIG: CampusConfig = {
  officeName: 'Campus Reclaim Office',
  dropOffSpots: [
    'Campus Security Desk',
    'Main Library Help Desk',
    'Student Affairs Center',
    'Campus Reception Desk',
  ],
  contactEmail: 'lostandfound@college.edu',
  contactPhone: 'Available via Campus Helpdesk',
  officeHours: 'Monday – Friday (Campus Operating Hours)',
  locationInfo: 'Campus Security & Property Desk',
  pickupInstructions: 'Present your official student ID card at the designated drop-off desk.',
};

const SETTINGS_DOC = 'campus_config';

export function subscribeCampusConfig(
  onData: (config: CampusConfig) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', SETTINGS_DOC);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<CampusConfig>;
        onData({
          officeName: data.officeName || DEFAULT_CAMPUS_CONFIG.officeName,
          dropOffSpots: data.dropOffSpots || DEFAULT_CAMPUS_CONFIG.dropOffSpots,
          contactEmail: data.contactEmail || DEFAULT_CAMPUS_CONFIG.contactEmail,
          contactPhone: data.contactPhone || DEFAULT_CAMPUS_CONFIG.contactPhone,
          officeHours: data.officeHours || DEFAULT_CAMPUS_CONFIG.officeHours,
          locationInfo: data.locationInfo || DEFAULT_CAMPUS_CONFIG.locationInfo,
          pickupInstructions: data.pickupInstructions || DEFAULT_CAMPUS_CONFIG.pickupInstructions,
        });
      } else {
        onData(DEFAULT_CAMPUS_CONFIG);
      }
    },
    (error) => {
      console.warn('Settings listener using default config:', error);
      onData(DEFAULT_CAMPUS_CONFIG);
    }
  );
}

export async function saveCampusConfig(config: CampusConfig): Promise<void> {
  const docRef = doc(db, 'settings', SETTINGS_DOC);
  try {
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `settings/${SETTINGS_DOC}`);
  }
}
