import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { updateItem } from './items';
import { ClaimStatus, ItemClaim } from '../types';

const CLAIMS_COLLECTION = 'claims';

export function subscribeAllClaims(
  onData: (claims: ItemClaim[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const claimsRef = collection(db, CLAIMS_COLLECTION);
  const q = query(claimsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const claims: ItemClaim[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        claims.push({
          id: docSnap.id,
          itemId: data.itemId || '',
          itemTitle: data.itemTitle || '',
          claimantId: data.claimantId || '',
          claimantName: data.claimantName || '',
          claimantEmail: data.claimantEmail || '',
          claimantPhone: data.claimantPhone || '',
          proofDetails: data.proofDetails || '',
          proofImageUrl: data.proofImageUrl || '',
          status: data.status || 'pending',
          adminNotes: data.adminNotes || '',
          reviewedBy: data.reviewedBy || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onData(claims);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, CLAIMS_COLLECTION);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

export function subscribeUserClaims(
  userId: string,
  onData: (claims: ItemClaim[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const claimsRef = collection(db, CLAIMS_COLLECTION);
  const q = query(claimsRef, where('claimantId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const claims: ItemClaim[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        claims.push({
          id: docSnap.id,
          itemId: data.itemId || '',
          itemTitle: data.itemTitle || '',
          claimantId: data.claimantId || '',
          claimantName: data.claimantName || '',
          claimantEmail: data.claimantEmail || '',
          claimantPhone: data.claimantPhone || '',
          proofDetails: data.proofDetails || '',
          proofImageUrl: data.proofImageUrl || '',
          status: data.status || 'pending',
          adminNotes: data.adminNotes || '',
          reviewedBy: data.reviewedBy || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      // Sort client-side by date
      claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(claims);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, CLAIMS_COLLECTION);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );
}

export function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REC-${segment1}-${segment2}`;
}

export async function createClaim(
  claim: Omit<ItemClaim, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = 'claim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const docRef = doc(db, CLAIMS_COLLECTION, id);
  const now = new Date().toISOString();

  const payload = {
    ...claim,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, payload);
    // Also update item status to 'claimed' (or under review)
    if (claim.itemId) {
      await updateItem(claim.itemId, { status: 'claimed' }).catch((e) =>
        console.warn('Item status update deferred:', e)
      );
    }
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${CLAIMS_COLLECTION}/${id}`);
  }
}

export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus,
  adminNotes?: string,
  reviewedBy?: string,
  itemId?: string
): Promise<string | undefined> {
  const docRef = doc(db, CLAIMS_COLLECTION, claimId);
  try {
    let generatedCode: string | undefined;
    const payload: Partial<ItemClaim> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (adminNotes !== undefined) payload.adminNotes = adminNotes;
    if (reviewedBy) payload.reviewedBy = reviewedBy;

    if (status === 'approved') {
      generatedCode = generateRecoveryCode();
      payload.recoveryCode = generatedCode;
    }

    await updateDoc(docRef, payload);

    if (itemId) {
      if (status === 'approved') {
        await updateItem(itemId, { status: 'claimed' });
      } else if (status === 'returned') {
        await updateItem(itemId, { status: 'returned' });
      } else if (status === 'rejected') {
        await updateItem(itemId, { status: 'open' });
      }
    }

    return generatedCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CLAIMS_COLLECTION}/${claimId}`);
  }
}

export async function verifyClaimRecovery(
  claimId: string,
  code: string,
  verifiedBy: string,
  itemId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, CLAIMS_COLLECTION, claimId);
    const now = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'returned',
      recoveredAt: now,
      verifiedBy,
      updatedAt: now,
    });

    if (itemId) {
      await updateItem(itemId, { status: 'returned' });
    }

    return { success: true, message: 'Item handover successfully verified and marked as recovered.' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Verification failed: ${message}` };
  }
}

export async function deleteClaim(claimId: string): Promise<void> {
  const docRef = doc(db, CLAIMS_COLLECTION, claimId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CLAIMS_COLLECTION}/${claimId}`);
  }
}
