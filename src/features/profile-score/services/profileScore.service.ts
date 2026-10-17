import api from "@/lib/axios";
import type { ProfileScoreResponse } from "../types/profileScore.types";

/**
 * Fetches the profile score from the backend.
 * The backend calculates the score based on profile completeness.
 */
export async function getProfileScore(): Promise<ProfileScoreResponse> {
  const res = await api.get<ProfileScoreResponse>("/profile/score");
  return res.data;
}
