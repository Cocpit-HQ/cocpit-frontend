import api from "@/lib/axios";
import { CompanyRole } from "@/types/user";

export const updateMemberRoleSettings = async (
    companyId: string,
    settings: { is_primary_display?: boolean; is_role_visible?: boolean }
): Promise<CompanyRole> => {
    const response = await api.put(`/companies/${companyId}/my-role-settings`, settings);
    return response.data;
};
