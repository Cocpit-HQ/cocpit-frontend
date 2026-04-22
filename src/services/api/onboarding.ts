import api from "@/lib/axios";

export interface CheckAccountNameResponse {
  available: boolean;
  message?: string;
}

export interface CompleteOnboardingResponse {
  message: string;
  user: {
    id: string;
    email: string;
    onboarding_complete: boolean;
  };
}

export const checkAccountNameAvailability = async (accountName: string): Promise<boolean> => {
  const response = await api.get<CheckAccountNameResponse>(`/onboarding/check-account-name?account_name=${encodeURIComponent(accountName)}`);
  return response.data.available;
};

// Save the user's selected role
export const saveOnboardingRole = async (role: string): Promise<any> => {
  const response = await api.patch("/onboarding/role", { role });
  return response.data;
};

// Save role-specific details (education or work experience)
export interface SaveDetailsPayload {
  role: string;
  school_name?: string;
  degree?: string;
  title?: string;
  company_name?: string;
}

export const saveOnboardingDetails = async (payload: SaveDetailsPayload): Promise<any> => {
  const response = await api.patch("/onboarding/details", payload);
  return response.data;
};

// Save interests (min 3)
export const saveOnboardingInterests = async (interests: string[]): Promise<any> => {
  const response = await api.patch("/onboarding/interests", { interests });
  return response.data;
};

// Save skills (min 3)
export const saveOnboardingSkills = async (skills: string[]): Promise<any> => {
  const response = await api.patch("/onboarding/skills", { skills });
  return response.data;
};

// Complete onboarding (mark as done)
export const completeOnboarding = async (): Promise<CompleteOnboardingResponse> => {
  const response = await api.post<CompleteOnboardingResponse>("/onboarding/complete", {});
  return response.data;
};

export interface UpdateOnboardingProfilePayload {
  account_name: string;
  full_name: string;
  location_id?: string;
}

export const updateOnboardingProfile = async (formData: FormData): Promise<any> => {
  const response = await api.patch("/onboarding/profile", formData);
  return response.data;
};

export interface UpdateOnboardingLocationPayload {
  location_id: string;
  location: string;
}

export const updateOnboardingLocation = async (payload: UpdateOnboardingLocationPayload): Promise<any> => {
  const response = await api.patch("/onboarding/location", payload);
  return response.data;
};
