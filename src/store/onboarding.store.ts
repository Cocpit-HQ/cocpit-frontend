import { create } from 'zustand';

interface OnboardingState {
  // Step Management
  step: number;
  userRole: string | null;
  showSubStep: boolean;

  // Profile Data
  fullName: string;
  accountName: string;
  initialAccountName: string | null;
  profileImage: string | null;
  profileImageFile: File | null;
  
  // Location Data
  locationPlaceId: string | null;
  locationFormatted: string | null;
  locationCountry: string | null;
  locationState: string | null;
  locationCity: string | null;
  locationLat: number | null;
  locationLng: number | null;

  // Legacy fields (retained for transition)
  locationId: string | null;
  locationName: string | null;
  latitude: string | null;
  longitude: string | null;

  // Interests & Skills
  selectedInterests: string[];
  selectedSkills: string[];

  // Sub-step Details (Education, Work, etc.)
  schoolName: string;
  degree: string;
  companyName: string;
  jobTitle: string;
  
  // Bulk Profile Data (Parsed from AI)
  educationList: any[];
  workExperienceList: any[];

  // Parsed Resume Data
  parsedResumeData: any | null;

  isInitialized: boolean;

  // Actions
  setStep: (step: number) => void;
  setUserRole: (role: string | null) => void;
  setShowSubStep: (show: boolean) => void;
  setFullName: (name: string) => void;
  setAccountName: (name: string) => void;
  setInitialAccountName: (name: string | null) => void;
  setProfileImage: (image: string | null) => void;
  setProfileImageFile: (file: File | null) => void;
  setLocation: (loc: { id?: string | number, name?: string | null, placeId?: string, formattedAddress?: string, country?: string, state?: string | null, city?: string, latitude?: string | number | null, longitude?: string | number | null } | null) => void;
  setSelectedInterests: (interests: string[]) => void;
  setSelectedSkills: (skills: string[]) => void;
  setEducation: (school: string, degree: string) => void;
  setWorkExperience: (company: string, title: string) => void;
  setEducationList: (list: any[]) => void;
  setWorkExperienceList: (list: any[]) => void;
  setParsedResumeData: (data: any | null) => void;
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
  initialAccountName: null,
  profileImage: null,
  profileImageFile: null,
  locationPlaceId: null,
  locationFormatted: null,
  locationCountry: null,
  locationState: null,
  locationCity: null,
  locationLat: null,
  locationLng: null,
  locationId: null,
  locationName: null,
  latitude: null,
  longitude: null,
  selectedInterests: [],
  selectedSkills: [],
  schoolName: '',
  degree: '',
  companyName: '',
  jobTitle: '',
  educationList: [],
  workExperienceList: [],
  parsedResumeData: null,
  isInitialized: false,

  // Actions
  setStep: (step) => set({ step }),
  setUserRole: (userRole) => set({ userRole }),
  setShowSubStep: (showSubStep) => set({ showSubStep }),
  setFullName: (fullName) => set({ fullName }),
  setAccountName: (accountName) => set({ accountName }),
  setInitialAccountName: (initialAccountName) => set({ initialAccountName }),
  setProfileImage: (profileImage) => set({ profileImage }),
  setProfileImageFile: (profileImageFile) => set({ profileImageFile }),
  setLocation: (loc) => {
    if (!loc) {
      set({
        locationPlaceId: null,
        locationFormatted: null,
        locationCountry: null,
        locationState: null,
        locationCity: null,
        locationLat: null,
        locationLng: null,
        locationId: null,
        locationName: null,
        latitude: null,
        longitude: null,
      });
    } else if (loc.placeId) {
      set({
        locationPlaceId: loc.placeId,
        locationFormatted: loc.formattedAddress,
        locationCountry: loc.country,
        locationState: loc.state,
        locationCity: loc.city,
        locationLat: loc.latitude ? Number(loc.latitude) : null,
        locationLng: loc.longitude ? Number(loc.longitude) : null,
        locationId: null,
        locationName: loc.formattedAddress,
        latitude: loc.latitude?.toString() || null,
        longitude: loc.longitude?.toString() || null,
      });
    } else {
      set({
        locationId: loc.id?.toString(),
        locationName: loc.name,
        latitude: loc.latitude ? String(loc.latitude) : null,
        longitude: loc.longitude ? String(loc.longitude) : null,
      });
    }
  },
  setSelectedInterests: (selectedInterests) => set({ selectedInterests }),
  setSelectedSkills: (selectedSkills) => set({ selectedSkills }),
  setEducation: (schoolName, degree) => set({ schoolName, degree }),
  setWorkExperience: (companyName, jobTitle) => set({ companyName, jobTitle }),
  setEducationList: (educationList) => set({ educationList }),
  setWorkExperienceList: (workExperienceList) => set({ workExperienceList }),
  setParsedResumeData: (parsedResumeData) => set({ parsedResumeData }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  resetOnboardingStore: () => set({
    step: 0,
    userRole: null,
    showSubStep: false,
    fullName: '',
    accountName: '',
    initialAccountName: null,
    profileImage: null,
    profileImageFile: null,
    locationPlaceId: null,
    locationFormatted: null,
    locationCountry: null,
    locationState: null,
    locationCity: null,
    locationLat: null,
    locationLng: null,
    locationId: null,
    locationName: null,
    latitude: null,
    longitude: null,
    selectedInterests: [],
    selectedSkills: [],
    schoolName: '',
    degree: '',
    companyName: '',
    jobTitle: '',
    educationList: [],
    workExperienceList: [],
    isInitialized: false,
  }),
}));
