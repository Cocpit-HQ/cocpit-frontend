import api from "@/lib/axios";
import { CompanyRole } from "@/types/user";

export const updateMemberRoleSettings = async (
    companyId: string,
    settings: { is_primary_display?: boolean; is_role_visible?: boolean }
): Promise<CompanyRole> => {
    const response = await api.put(`/organizations/${companyId}/my-role-settings`, settings);
    return response.data;
};

export interface OrganizationSuggestion {
  org_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  entity_type: string;
  location: string | null;
  industry: string | null;
  headline: string | null;
}

export const searchOrganizations = async (
  query: string, 
  entityType?: string, 
  signal?: AbortSignal
): Promise<OrganizationSuggestion[]> => {
  if (!query || query.length < 2) return [];
  const params: any = { q: query };
  if (entityType) {
    params.entity_type = entityType;
  }
  const response = await api.get("/organizations/search", { 
    params,
    signal
  });
  return response.data;
};
