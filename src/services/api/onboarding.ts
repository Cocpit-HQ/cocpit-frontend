import api from "@/lib/axios";

export interface SchoolOption {
  name: string;
  org_id: string | null;
  logo_url: string | null;
}

export interface EducationListResponse {
  schools: SchoolOption[];
  degrees: string[];
  specializations: string[];
}

export const getEducationList = async (
  schoolSearch = "",
  degreeSearch = "",
  specializationSearch = ""
): Promise<EducationListResponse> => {
  const response = await api.get<EducationListResponse>(
    "/profile/educations",
    {
      params: {
        ...(schoolSearch && { school_search: schoolSearch }),
        ...(degreeSearch && { degree_search: degreeSearch }),
        ...(specializationSearch && {
          specialization_search: specializationSearch,
        }),
      },
    }
  );

  return response.data;
};

export interface CompanyOption {
  name: string;
  org_id: string | null;
  logo_url: string | null;
  established_year: number | null;
}

export interface CompanyListResponse {
  companies: CompanyOption[];
  titles: string[];
}

export const getCompanyList = async (companySearch = "", titleSearch = ""): Promise<CompanyListResponse> => {
  const params = new URLSearchParams();
  if (companySearch) params.append("company_search", companySearch);
  if (titleSearch) params.append("title_search", titleSearch);
  const response = await api.get<CompanyListResponse>(`/profile/companies?${params.toString()}`);
  return response.data;
};

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
  school_org_id?: string | null;
  degree?: string;
  field_of_study?: string | null;
  title?: string;
  company_name?: string;
  org_id?: string | null;
  educations?: any[];
  experiences?: any[];
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

// Parse resume for onboarding
export const parseResume = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("resume", file);
  
  const response = await api.post("/onboarding/resume/parse", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // Increase timeout to 60s because AI parsing can be slow
    timeout: 60000 
  });
  
  return response.data;
};

// Save skills (min 3)
export const saveOnboardingSkills = async (skills: string[]): Promise<any> => {
  const response = await api.patch("/onboarding/skills", { skills });
  return response.data;
};

// Complete onboarding (mark as done)
export const completeOnboarding = async (): Promise<CompleteOnboardingResponse> => {
  const response = await api.post<CompleteOnboardingResponse>("/onboarding/complete", { finish: true });
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
  country: string;
  state: string | null;
  city: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string;
}

export const updateOnboardingLocation = async (payload: UpdateOnboardingLocationPayload): Promise<any> => {
  const response = await api.patch("/onboarding/location", payload);
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

// ─── GET /onboarding/interests (cursor-based) ──────────────────────────────

/** Number of interests fetched per page — hardcoded here, sent as `limit` query param */
export const INTERESTS_PAGE_SIZE = 20;

export interface Interest {
  interest_id: string;
  name: string;
  slug: string;
  category: string | null;
  icon_url: string | null;
  usage_count: number;
}

export interface GetInterestsParams {
  /** Search term — filters name/slug server-side via ILIKE */
  q?: string;
  /** Opaque base64 cursor returned by the previous page */
  cursor?: string;
  /** Items per page (default: INTERESTS_PAGE_SIZE, backend caps at 50) */
  limit?: number;
}

export interface GetInterestsResponse {
  success: boolean;
  data: {
    items: Interest[];
    /** Pass this as `cursor` on the next call. null = no more pages */
    next_cursor: string | null;
    has_more: boolean;
  };
}

export const getOnboardingInterests = async (
  params: GetInterestsParams = {}
): Promise<GetInterestsResponse> => {
  const { q, cursor, limit = INTERESTS_PAGE_SIZE } = params;
  const response = await api.get<GetInterestsResponse>("/onboarding/interests", {
    params: {
      ...(q ? { q } : {}),
      ...(cursor ? { cursor } : {}),
      limit,
    },
  });
  return response.data;
};

// ─── GET /onboarding/skills (cursor-based) ─────────────────────────────────

export interface Skill {
  skill_id: string;
  name: string;
}

export interface GetSkillsParams {
  q?: string;
  cursor?: string;
  limit?: number;
}

export interface GetSkillsResponse {
  success: boolean;
  data: {
    items: Skill[];
    next_cursor: string | null;
    has_more: boolean;
  };
}

export const getOnboardingSkills = async (
  params: GetSkillsParams = {}
): Promise<GetSkillsResponse> => {
  const { q, cursor, limit = INTERESTS_PAGE_SIZE } = params;
  const response = await api.get<GetSkillsResponse>("/onboarding/skills", {
    params: {
      ...(q ? { q } : {}),
      ...(cursor ? { cursor } : {}),
      limit,
    },
  });
  return response.data;
};

// ─── Step 2 Situation & Options Endpoints ─────────────────────────────────

export interface OnboardingOptionItem {
  id: string;
  label: string;
}

export const getOnboardingOptions = async (
  slug: string,
  q?: string
): Promise<OnboardingOptionItem[]> => {
  const response = await api.get<{ success: boolean; data: OnboardingOptionItem[] }>(
    `/onboarding/options/${slug}`,
    {
      params: q ? { q } : undefined,
    }
  );
  return response.data.data || [];
};

export interface SaveOnboardingSituationPayload {
  status: string;
  industry?: string | null;
  formattedAddress: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
}

export const saveOnboardingSituation = async (
  payload: SaveOnboardingSituationPayload
): Promise<any> => {
  const response = await api.patch("/onboarding/situation", payload);
  return response.data;
};


