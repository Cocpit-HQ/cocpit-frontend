import api, { publicApi } from "@/lib/axios";
import { PublicUserProfileResponse } from "@/types/api";
import { SearchedUser } from "@/types/user";

export const searchUsers = async (query: string): Promise<SearchedUser[]> => {
  const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getUserById = async (id: string, sourcePostId?: string): Promise<PublicUserProfileResponse> => {
  const response = await api.get(`/users/${id}`, {
    params: sourcePostId ? { sourcePostId } : undefined,
  });
  return response.data;
};

/**
 * Schedule account deletion.
 * - Password users: pass { password }
 * - Google users: pass { idToken } from Google re-authentication
 */
export const deleteAccount = async (
  credential: { password?: string; idToken?: string; companyIdsToDelete?: string[] }
): Promise<{ message: string; deletionDate: string }> => {
  const response = await api.delete("/users/account", {
    data: credential,
  });
  return response.data;
};

/**
 * Restore an account using the single-use token from the recovery email.
 */
export const restoreAccount = async (
  token: string
): Promise<{ message: string }> => {
  const response = await publicApi.post("/users/account/restore", { token });
  return response.data;
};

/**
 * Request a fresh recovery email for a pending-deletion account.
 * Always resolves (never throws) — backend does not reveal if email exists.
 */
export const resendRecoveryEmail = async (email: string): Promise<void> => {
  await publicApi.post("/users/account/resend-recovery", { email });
};