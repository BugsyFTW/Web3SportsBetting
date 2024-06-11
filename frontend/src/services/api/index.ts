import { api } from "@utils/api-client";
import { FootballData } from "@/types";

// https://api.football-data.org/v4/competitions/EC/matches?matchday=1

export const getGames = async (matchday: number) => {
  const controller = new AbortController();
  const response = await api.get<FootballData>('/v4/competitions/EC/matches', {
    params: {
      matchday
    },
    signal: controller.signal
  });
  return {data: response.data, controller};
};