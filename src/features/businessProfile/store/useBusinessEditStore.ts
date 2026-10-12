import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Office {
  id: string;
  country: string;
  city: string;
  address: string;
  mapUrl: string;
  latitude?: number | null;
  longitude?: number | null;
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

interface BusinessEditState {
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
    keyOfferings?: KeyOffering[];
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
    keyOfferings?: string[];
    isInitialized: boolean;
    draftSlug: string | null;
  };

  // Actions
  setProfileDraft: (data: Partial<BusinessEditState["profileDraft"]>) => void;
  hydrateProfileDraft: (
    data: Omit<BusinessEditState["profileDraft"], "isInitialized" | "draftSlug">,
    slug: string
  ) => void;
  setAboutDraft: (data: Partial<BusinessEditState["aboutDraft"]>) => void;
  hydrateAboutDraft: (
    data: Omit<BusinessEditState["aboutDraft"], "isInitialized" | "draftSlug">,
    slug: string
  ) => void;
  clearProfileDraft: () => void;
  clearAboutDraft: () => void;
}

const defaultProfileDraft = {
  name: "",
  industry: "",
  foundedYear: "",
  size: "",
  website: "",
  country: "",
  city: "",
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
  keyOfferings: [],
  isInitialized: false,
  draftSlug: null,
};

export const useBusinessEditStore = create<BusinessEditState>()(
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
          profileDraft: { keyOfferings: [], ...data, isInitialized: true, draftSlug: slug },
        })),

      setAboutDraft: (data) =>
        set((state) => ({
          aboutDraft: { ...state.aboutDraft, ...data },
        })),

      hydrateAboutDraft: (data, slug) =>
        set(() => ({
          aboutDraft: { keyOfferings: [], ...data, isInitialized: true, draftSlug: slug },
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
      name: "business-edit-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useCompanyEditStore = useBusinessEditStore;
