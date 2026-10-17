import { useQuery } from "@tanstack/react-query";
import { getProfileScore } from "../services/profileScore.service";
import type { ProfileScoreResponse } from "../types/profileScore.types";

/**
 * React Query hook to fetch and cache the profile score independently.
 * The score is invalidated after any profile mutation via the
 * PROFILE_SCORE_QUERY_KEY exported below.
 */
export const PROFILE_SCORE_QUERY_KEY = ["profileScore"] as const;

// TODO(mock): GET /profile/score isn't implemented on the backend yet.
// Remove MOCK_PROFILE_SCORE and the try/catch fallback below once it is.
const MOCK_PROFILE_SCORE: ProfileScoreResponse = {
  score: 82,
  breakdown: {
    basic_info: { earned: 20, max: 20, missing: [] },
    skills: { earned: 15, max: 15, missing: [] },
    experience: { earned: 20, max: 20, missing: [] },
    projects: { earned: 7, max: 15, missing: ["projects"] },
    education: { earned: 10, max: 20, missing: ["education"] },
    profile_banner: { earned: 10, max: 10, missing: [] },
  },
};

export function useProfileScore() {
  return useQuery({
    queryKey: PROFILE_SCORE_QUERY_KEY,
    queryFn: async () => {
      try {
        return await getProfileScore();
      } catch {
        return MOCK_PROFILE_SCORE;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
