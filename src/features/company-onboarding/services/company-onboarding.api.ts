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
  org_id: string;
}

export const getCountries = async (): Promise<string[]> => {
  const response = await api.get("/organizations/countries");
  return response.data.countries;
};

export const sendEmailOTP = async (email: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/verify-email/send`, { email });
  return response.data;
};

export const confirmEmailOTP = async (email: string, otp: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/verify-email/confirm`, { email, otp });
  return response.data;
};

export const sendPhoneOTP = async (phone: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/verify-phone/send`, { phone });
  return response.data;
};

export const confirmPhoneOTP = async (phone: string, otp: string): Promise<VerifyOTPResponse> => {
  const response = await api.post(`/organizations/verify-phone/confirm`, { phone, otp });
  return response.data;
};

export const publishNewOrganization = async (
  formData: FormData,
  actorHeadersOverride?: { 'x-actor-type': string; 'x-actor-id': string }
): Promise<CompleteOnboardingResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
    ...(actorHeadersOverride || {}),
  };
  const response = await api.post(`/organizations/publish-new`, formData, {
    headers,
  });
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

export const getPlacesAutocomplete = async (query: string, sessionToken: string, country?: string): Promise<PlaceAutocompleteResponse> => {
  let url = `/places/autocomplete?q=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(sessionToken)}`;
  if (country) url += `&country=${encodeURIComponent(country)}`;
  const response = await api.get(url);
  return response.data;
};

export const getPlaceDetails = async (placeId: string, sessionToken: string): Promise<PlaceDetailsResponse> => {
  const response = await api.get(`/places/details?placeId=${encodeURIComponent(placeId)}&sessionToken=${encodeURIComponent(sessionToken)}`);
  return response.data;
};
