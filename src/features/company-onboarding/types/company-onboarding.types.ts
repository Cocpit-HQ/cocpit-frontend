export type OrganizationType = 'COMPANY' | 'INSTITUTE';

export interface LocationData {
  country: string;
  city: string;
}

export interface DocumentData {
  id: string;
  file: File | null;
  preview: string | null;
}

export interface CompanyOnboardingState {
  // Navigation
  currentStage: number;
  organizationType: OrganizationType | null;

  // Stage 1: Identity
  organizationName: string;
  foundedYear: string;
  industry: string;
  logoFile: File | null;
  logoPreview: string | null;

  // Stage 2: Presence
  officialEmail: string;
  isEmailVerified: boolean;
  phoneCountryCode: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
  website: string;
  organizationSize: string;
  
  // HQ Location
  hqCountry: string;
  hqCity: string;
  
  // Content
  headline: string;
  description: string;

  // Stage 3: Verification
  countryOfOperation: string;
  documents: DocumentData[];
  showValidationErrors: boolean;

  // Actions
  setOrganizationType: (type: OrganizationType) => void;
  setCurrentStage: (stage: number) => void;
  goNext: () => void;
  goBack: () => void;
  updateField: <K extends keyof CompanyOnboardingState>(key: K, value: CompanyOnboardingState[K]) => void;
  setLogo: (file: File | null) => void;
  addDocument: () => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, file: File) => void;
  resetStore: () => void;
}
