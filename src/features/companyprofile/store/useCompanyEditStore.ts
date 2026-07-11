import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Office {
  id: string;
  country: string;
  city: string;
  address: string;
  mapUrl: string;
}

export interface CustomLink {
  id: string;
  label: string;
  platform: string;
  url: string;
}

export interface KeyOffering {
  id: string;
  text: string;
}

interface CompanyEditState {
  // Profile Tab State
  profileDraft: {
    name: string;
    industry: string;
    foundedYear: string;
    size: string;
    website: string;
    country: string;
    city: string;
    headline: string;
    keyOfferings: KeyOffering[];
    isInitialized: boolean;
  };

  // About Tab State
  aboutDraft: {
    description: string;
    slogan: string;
    offices: Office[];
    links: CustomLink[];
    specialties: string;
    isInitialized: boolean;
  };

  // Actions
  setProfileDraft: (data: Partial<CompanyEditState["profileDraft"]>) => void;
  setAboutDraft: (data: Partial<CompanyEditState["aboutDraft"]>) => void;
  clearProfileDraft: () => void;
  clearAboutDraft: () => void;
}

const defaultProfileDraft = {
  name: "",
  industry: "Technology",
  foundedYear: "",
  size: "1 - 10 Members",
  website: "",
  country: "India",
  city: "Mumbai",
  headline: "",
  keyOfferings: [],
  isInitialized: false,
};

const defaultAboutDraft = {
  description: "",
  slogan: "",
  offices: [],
  links: [],
  specialties: "",
  isInitialized: false,
};

export const useCompanyEditStore = create<CompanyEditState>()(
  persist(
    (set) => ({
      profileDraft: defaultProfileDraft,
      aboutDraft: defaultAboutDraft,

      setProfileDraft: (data) =>
        set((state) => ({
          profileDraft: { ...state.profileDraft, ...data },
        })),

      setAboutDraft: (data) =>
        set((state) => ({
          aboutDraft: { ...state.aboutDraft, ...data },
        })),

      clearProfileDraft: () =>
        set((state) => ({
          profileDraft: defaultProfileDraft,
        })),

      clearAboutDraft: () =>
        set((state) => ({
          aboutDraft: defaultAboutDraft,
        })),
    }),
    {
      name: "company-edit-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
