export type HostelCategory = 'boys' | 'girls';

export type RoomSharingType =
  | 'Single Private'
  | '2-Seater'
  | '3-Seater'
  | '4-Seater';

export type ContactStatus =
  | 'Not Contacted'
  | 'Contacted'
  | 'Interested'
  | 'Not Interested'
  | 'Awaiting Information'
  | 'Verification Pending'
  | 'Approved'
  | 'Rejected';

export type VerificationStatus =
  | 'awaiting_information'
  | 'verification_pending'
  | 'changes_requested'
  | 'approved'
  | 'rejected';

export type ContactMethod =
  | 'Phone Call'
  | 'WhatsApp Business'
  | 'In-Person Visit'
  | 'Email';

export interface RoomTypeOffering {
  type: RoomSharingType;
  monthlyRent: number;
  availableBeds: number;
}

export interface OwnerConsentRecord {
  signed: boolean;
  authorityConfirmed: boolean;
  signatoryName: string;
  authorityRole: 'Owner' | 'Authorized Manager';
  consentTimestamp: string;
  termsVersion: string;
}

export interface VerificationChecklist {
  authorityVerified: boolean;
  addressReviewed: boolean;
  photosReviewed: boolean;
  consentConfirmed: boolean;
}

export interface VerificationHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
}

export interface ContactLogEntry {
  id: string;
  date: string;
  method: ContactMethod;
  status: ContactStatus;
  summary: string;
  recordedBy: string;
}

export interface HostelListing {
  id: string;
  slug: string;
  name: string;
  ownerName: string;
  managerName: string;
  ownerEmail: string;
  publicPhone: string;
  publicEmail: string;
  city: string;
  area: string;
  fullAddress: string;
  category: HostelCategory;
  roomTypes: RoomTypeOffering[];
  monthlyRentMin: number;
  monthlyRentMax: number;
  securityDeposit: number;
  availableBedsTotal: number;
  facilities: string[];
  mealArrangements: string;
  internetAvailability: string;
  electricityBackup: string;
  securityArrangements: string;
  hostelRules: string;
  photos: string[];
  ownerConsent: OwnerConsentRecord;
  verificationStatus: VerificationStatus;
  verificationChecklist: VerificationChecklist;
  adminChangeRequest?: string;
  adminNotes?: string;
  approvedAt?: string;
  lastUpdatedAt: string;
  lastAvailabilityUpdateAt: string;
  isActive: boolean;
  isDevSample?: boolean;
}

export type PublicHostelListing = Omit<
  HostelListing,
  'adminNotes' | 'adminChangeRequest' | 'ownerEmail'
>;

export interface AcquisitionContactRecord {
  id: string;
  hostelName: string;
  publicBusinessContact: string;
  area: string;
  category: HostelCategory;
  sourceType: 'Public Directory' | 'Campus Notice' | 'Direct Inquiry' | 'Referral';
  contactDate: string;
  contactMethod: ContactMethod;
  contactStatus: ContactStatus;
  followUpDate: string;
  notes: string;
  linkedHostelId?: string;
  contactHistory: ContactLogEntry[];
  verificationHistory: VerificationHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
