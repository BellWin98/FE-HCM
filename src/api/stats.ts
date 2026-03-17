import { api } from "@/lib/api";

export type LandingStats = {
  totalUsers: number;
  totalExerciseProofs: number;
  activeRooms: number;
};

type LandingStatsApiResponse = {
  totalUsers: number;
  totalExerciseProofs: number;
  activeRooms: number;
};

export const getLandingStats = async (): Promise<LandingStats> => {
  const response = await api.request<LandingStatsApiResponse>("/stats/landing-summary", {
    method: "GET",
  });

  return {
    totalUsers: response.totalUsers,
    totalExerciseProofs: response.totalExerciseProofs,
    activeRooms: response.activeRooms,
  };
};

