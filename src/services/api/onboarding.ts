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
    // Add other fields if returned
  };
}

export const checkAccountNameAvailability = async (accountName: string): Promise<boolean> => {
  const response = await api.get<CheckAccountNameResponse>(`/onboarding/check-account-name?account_name=${encodeURIComponent(accountName)}`);
  return response.data.available;
};

export const completeOnboarding = async (data: FormData): Promise<CompleteOnboardingResponse> => {
  // Axios automatically sets Content-Type to multipart/form-data when data is FormData
  const response = await api.post<CompleteOnboardingResponse>("/onboarding/complete", data);
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
