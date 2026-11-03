export type UserRole = 'student' | 'staff' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  campusId?: string;
  phone?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'claimed' | 'returned' | 'closed';

export type ItemCategory =
  | 'electronics'
  | 'id_cards'
  | 'keys'
  | 'books_stationery'
  | 'clothing'
  | 'bags'
  | 'water_bottles'
  | 'jewelry'
  | 'sports'
  | 'other';

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  itemType: ItemType;
  category: ItemCategory | string;
  location: string;
  incidentDate: string;
  status: ItemStatus;
  imageUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  reportedBy: string;
  reportedByName?: string;
  reportedByEmail?: string;
  securityQuestion?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'returned';

export interface ItemClaim {
  id: string;
  itemId: string;
  itemTitle: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  proofDetails: string;
  proofImageUrl?: string;
  status: ClaimStatus;
  adminNotes?: string;
  reviewedBy?: string;
  recoveryCode?: string;
  recoveredAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'claim_received'
  | 'claim_approved'
  | 'claim_rejected'
  | 'match_found'
  | 'item_recovered';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  itemId?: string;
  claimId?: string;
  read: boolean;
  createdAt: string;
}

export interface MatchSuggestion {
  targetItem: LostFoundItem;
  candidateItem: LostFoundItem;
  score: number; // 0 - 100
  reasons: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  actorEmail: string;
  actorName: string;
  details: string;
  timestamp: string;
}

export type PageView =
  | 'home'
  | 'dashboard'
  | 'browse'
  | 'lost'
  | 'found'
  | 'claims'
  | 'admin';

