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
  icon?: string;
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
    draftSlug: string | null;
  };

  // About Tab State
  aboutDraft: {
    description: string;
    slogan: string;
    offices: Office[];
    links: CustomLink[];
    specialties: string;
    isInitialized: boolean;
    draftSlug: string | null;
  };

  // Actions
  setProfileDraft: (data: Partial<CompanyEditState["profileDraft"]>) => void;
  // Replaces the draft with server-truth data and atomically marks it initialized
  // for `slug`, so isInitialized/draftSlug can never be set out of sync with the data.
  hydrateProfileDraft: (
    data: Omit<CompanyEditState["profileDraft"], "isInitialized" | "draftSlug">,
    slug: string
  ) => void;
  setAboutDraft: (data: Partial<CompanyEditState["aboutDraft"]>) => void;
  // Same rationale as hydrateProfileDraft: keeps isInitialized/draftSlug in
  // lockstep with the data so a stale/malformed cached draft can't linger.
  hydrateAboutDraft: (
    data: Omit<CompanyEditState["aboutDraft"], "isInitialized" | "draftSlug">,
    slug: string
  ) => void;
  clearProfileDraft: () => void;
  clearAboutDraft: () => void;
}

const defaultProfileDraft = {
  name: "",
  industry: "Information Technology",
  foundedYear: "",
  size: "1 - 10 Members",
  website: "",
  country: "India",
  city: "Mumbai",
  headline: "",
  keyOfferings: [],
  isInitialized: false,
  draftSlug: null,
};

const defaultAboutDraft = {
  description: "",
  slogan: "",
  offices: [],
  links: [],
  specialties: "",
  isInitialized: false,
  draftSlug: null,
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

      hydrateProfileDraft: (data, slug) =>
        set(() => ({
          profileDraft: { ...data, isInitialized: true, draftSlug: slug },
        })),

      setAboutDraft: (data) =>
        set((state) => ({
          aboutDraft: { ...state.aboutDraft, ...data },
        })),

      hydrateAboutDraft: (data, slug) =>
        set(() => ({
          aboutDraft: { ...data, isInitialized: true, draftSlug: slug },
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
