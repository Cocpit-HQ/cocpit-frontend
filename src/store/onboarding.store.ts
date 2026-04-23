import { create } from 'zustand';

interface OnboardingState {
  // Step Management
  step: number;
  userRole: string | null;
  showSubStep: boolean;

  // Profile Data
  fullName: string;
  accountName: string;
  profileImage: string | null;
  profileImageFile: File | null;
  
  // Location Data
  locationId: string | null;
  locationName: string | null;
  latitude: string | null;
  longitude: string | null;

  // Interests & Skills
  selectedInterests: string[];
  selectedSkills: string[];

  isInitialized: boolean;

  // Actions
  setStep: (step: number) => void;
  setUserRole: (role: string | null) => void;
  setShowSubStep: (show: boolean) => void;
  setFullName: (name: string) => void;
  setAccountName: (name: string) => void;
  setProfileImage: (image: string | null) => void;
  setProfileImageFile: (file: File | null) => void;
  setLocation: (id: string | null, name: string | null, lat?: string | null, lng?: string | null) => void;
  setSelectedInterests: (interests: string[]) => void;
  setSelectedSkills: (skills: string[]) => void;
  setInitialized: (initialized: boolean) => void;
  resetOnboardingStore: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  // Initial State
  step: 0,
  userRole: null,
  showSubStep: false,
  fullName: '',
  accountName: '',
  profileImage: null,
  profileImageFile: null,
  locationId: null,
  locationName: null,
  latitude: null,
  longitude: null,
  selectedInterests: [],
  selectedSkills: [],
  isInitialized: false,

  // Actions
  setStep: (step) => set({ step }),
  setUserRole: (userRole) => set({ userRole }),
  setShowSubStep: (showSubStep) => set({ showSubStep }),
  setFullName: (fullName) => set({ fullName }),
  setAccountName: (accountName) => set({ accountName }),
  setProfileImage: (profileImage) => set({ profileImage }),
  setProfileImageFile: (profileImageFile) => set({ profileImageFile }),
  setLocation: (locationId, locationName, latitude = null, longitude = null) => set({ locationId, locationName, latitude, longitude }),
  setSelectedInterests: (selectedInterests) => set({ selectedInterests }),
  setSelectedSkills: (selectedSkills) => set({ selectedSkills }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  resetOnboardingStore: () => set({
    step: 0,
    userRole: null,
    showSubStep: false,
    fullName: '',
    accountName: '',
    profileImage: null,
    profileImageFile: null,
    locationId: null,
    locationName: null,
    latitude: null,
    longitude: null,
    selectedInterests: [],
    selectedSkills: [],
    isInitialized: false,
  }),
}));
