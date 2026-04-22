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

export const updateProfile = async (data: FormData): Promise<any> => {
  const response = await api.patch("/onboarding/profile", data);
  return response.data;
};

export const updateLocation = async (data: any): Promise<any> => {
  const response = await api.patch("/onboarding/location", data);
  return response.data;
};

export const completeOnboarding = async (data: FormData = new FormData()): Promise<CompleteOnboardingResponse> => {
  const response = await api.post<CompleteOnboardingResponse>("/onboarding/complete", data);
  return response.data;
};

export const saveRole = async (data: { role: string }): Promise<any> => {
  const response = await api.patch("/onboarding/role", data);
  return response.data;
};

export const saveDetails = async (data: any): Promise<any> => {
  const response = await api.patch("/onboarding/details", data);
  return response.data;
};

export const saveInterests = async (data: { interests: string[] }): Promise<any> => {
  const response = await api.patch("/onboarding/interests", data);
  return response.data;
};

export const saveSkills = async (data: { skills: string[] }): Promise<any> => {
  const response = await api.patch("/onboarding/skills", data);
  return response.data;
};
