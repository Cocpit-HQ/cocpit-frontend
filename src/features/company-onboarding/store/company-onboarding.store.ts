import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CompanyOnboardingState, OrganizationType, DocumentData } from '../types/company-onboarding.types';
import { COMPANY_STAGES } from '../constants/onboarding.constants';

const initialState = {
  currentStage: 0,
  organizationType: null as OrganizationType | null,
  orgId: null as string | null,
  isSubmitting: false,
  apiError: null as string | null,
  slug: null as string | null,

  // Stage 1: Identity
  organizationName: '',
  foundedYear: '',
  industry: '',
  logoFile: null,
  logoPreview: null,

  // Stage 2: Presence
  officialEmail: '',
  isEmailVerified: false,
  phoneCountryCode: '+91',
  phoneNumber: '',
  isPhoneVerified: false,
  website: '',
  organizationSize: '',
  
  // HQ Location
  hqCountry: '',
  hqCity: '',
  
  // Content
  headline: '',
  description: '',

  // Stage 3: Verification
  countryOfOperation: '',
  documents: [{ id: 'doc-1', file: null, preview: null }] as DocumentData[],
  showValidationErrors: false,
};

export const useCompanyOnboardingStore = create<CompanyOnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

  // Actions
  setOrganizationType: (type: OrganizationType) => set({ organizationType: type }),
  
  setCurrentStage: (stage: number) => set({ currentStage: stage, apiError: null }),
  
  goNext: () => {
    const { currentStage } = get();
    const config = COMPANY_STAGES[currentStage as keyof typeof COMPANY_STAGES];
    if (config && config.next !== null) {
      set({ currentStage: config.next, apiError: null });
    }
  },
  

  goBack: () => {
    const { currentStage } = get();
    const config = COMPANY_STAGES[currentStage as keyof typeof COMPANY_STAGES];
    if (config && config.prev !== null) {
      set({ currentStage: config.prev, apiError: null });
    }
  },

  updateField: <K extends keyof CompanyOnboardingState>(key: K, value: CompanyOnboardingState[K]) => {
    set({ [key]: value } as Partial<CompanyOnboardingState>);
  },
  
  setLogo: (file: File | null) => {
    if (!file) {
      set({ logoFile: null, logoPreview: null });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      set({ 
        logoFile: file, 
        logoPreview: reader.result as string 
      });
    };
    reader.readAsDataURL(file);
  },

  addDocument: () => {
    set((state) => ({
      documents: [
        ...state.documents,
        { id: Math.random().toString(36).substring(7), file: null, preview: null }
      ]
    }));
  },

  removeDocument: (id: string) => {
    set((state) => {
      const doc = state.documents.find(d => d.id === id);
      if (doc?.preview) {
        URL.revokeObjectURL(doc.preview);
      }
      return {
        documents: state.documents.filter(d => d.id !== id)
      };
    });
  },

  updateDocument: (id: string, file: File) => {
    set((state) => {
      const newDocs = state.documents.map(doc => {
        if (doc.id === id) {
          if (doc.preview) URL.revokeObjectURL(doc.preview);
          return { ...doc, file, preview: URL.createObjectURL(file) };
        }
        return doc;
      });
      return { documents: newDocs };
    });
  },

  resetStore: () => {
    const { logoPreview, documents } = get();
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    documents.forEach(doc => {
      if (doc.preview) URL.revokeObjectURL(doc.preview);
    });
    set(initialState);
  },

  setOrgId: (id: string) => set({ orgId: id }),
  setIsSubmitting: (val: boolean) => set({ isSubmitting: val }),
  setApiError: (msg: string | null) => set({ apiError: msg }),

  hydrateFromProgress: (orgData: any, docs: any[]) => {
    set({
      orgId: orgData.org_id,
      organizationType: orgData.entity_type as OrganizationType,
      
      // Identity
      organizationName: orgData.name !== "Draft Organization" ? orgData.name : '',
      foundedYear: orgData.established_year ? String(orgData.established_year) : '',
      industry: orgData.industry || '',
      logoPreview: orgData.logo_url || null,
      
      // Presence
      officialEmail: orgData.email || '',
      isEmailVerified: orgData.email_verified || false,
      phoneNumber: orgData.phone || '',
      isPhoneVerified: orgData.phone_verified || false,
      website: orgData.website || '',
      organizationSize: orgData.size || '',
      hqCountry: orgData.country || '',
      hqCity: orgData.city || '',
      headline: orgData.headline || '',
      description: orgData.description || '',

      // Verification
      countryOfOperation: orgData.country || '',
      // Map remote docs
      documents: docs.map(d => ({
        id: d.document_id,
        file: null, // we can't restore File objects from URLs
        preview: d.document_url
      }))
    });
  }
}), {
  name: 'company-onboarding-storage',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => Object.fromEntries(
    Object.entries(state).filter(([key]) => !['logoFile', 'documents'].includes(key))
  ),
}));
