import api from "@/lib/axios";

export interface CreateDraftTypeResponse {
  success: boolean;
  org_id: string;
  entity_type: string;
  onboarding_step: string;
}

export interface GetOnboardingProgressResponse {
  success: boolean;
  organization: any;
  documents: any[];
}

export interface SaveDraftIdentityResponse {
  success: boolean;
  org_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  onboarding_step: string;
}

export interface SaveDraftPresenceResponse {
  success: boolean;
  onboarding_step: string;
}

export interface SaveDraftVerificationResponse {
  success: boolean;
  onboarding_step: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  verified?: boolean;
  message?: string;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  slug: string;
}

export const getCountries = async (): Promise<string[]> => {
  const response = await api.get("/organizations/countries");
  return response.data.countries;
};

export const createDraftType = async (type: 'COMPANY' | 'INSTITUTION'): Promise<CreateDraftTypeResponse> => {
  const response = await api.post("/organizations/type", { type });
  return response.data;
};

export const getOnboardingProgress = async (orgId: string): Promise<GetOnboardingProgressResponse> => {
  const response = await api.get(`/organizations/${orgId}/progress`);
  return response.data;
};

export const saveDraftIdentity = async (orgId: string, formData: FormData): Promise<SaveDraftIdentityResponse> => {
  const response = await api.put(`/organizations/${orgId}/identity`, formData);
  return response.data;
};

export const saveDraftPresence = async (
  orgId: string,
  data: {
    email: string;
    phone: string;
    website?: string;
    size: string;
    country: string;
    city: string;
    headline: string;
    description?: string;
  }
): Promise<SaveDraftPresenceResponse> => {
  const response = await api.put(`/organizations/${orgId}/presence`, data);
  return response.data;
};

export const sendEmailOTP = async (orgId: string, email: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/${orgId}/verify-email/send`, { email });
  return response.data;
};

export const confirmEmailOTP = async (orgId: string, email: string, otp: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/${orgId}/verify-email/confirm`, { email, otp });
  return response.data;
};

export const sendPhoneOTP = async (orgId: string, phone: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/${orgId}/verify-phone/send`, { phone });
  return response.data;
};

export const confirmPhoneOTP = async (orgId: string, phone: string, otp: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/${orgId}/verify-phone/confirm`, { phone, otp });
  return response.data;
};

export const saveDraftVerification = async (orgId: string, formData: FormData): Promise<SaveDraftVerificationResponse> => {
  const response = await api.put(`/organizations/${orgId}/verification`, formData);
  return response.data;
};

export const getProfilePreview = async (orgId: string): Promise<{ success: boolean; preview: any }> => {
  const response = await api.get(`/organizations/${orgId}/preview`);
  return response.data;
};

export const completeOnboarding = async (orgId: string): Promise<CompleteOnboardingResponse> => {
  const response = await api.post(`/organizations/${orgId}/complete`);
  return response.data;
};

export interface PlaceAutocompleteResponse {
  success: boolean;
  data: Array<{
    placeId: string;
    displayName: string;
    description: string;
  }>;
}

export interface PlaceDetailsResponse {
  success: boolean;
  data: {
    placeId: string;
    country: string;
    state: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export const getPlacesAutocomplete = async (query: string, sessionToken: string): Promise<PlaceAutocompleteResponse> => {
  const response = await api.get(`/places/autocomplete?q=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(sessionToken)}`);
  return response.data;
};

export const getPlaceDetails = async (placeId: string, sessionToken: string): Promise<PlaceDetailsResponse> => {
  const response = await api.get(`/places/details?placeId=${encodeURIComponent(placeId)}&sessionToken=${encodeURIComponent(sessionToken)}`);
  return response.data;
};
