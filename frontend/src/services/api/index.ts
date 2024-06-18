import { api } from "@utils/api-client";
import { FootballData, CompetitionData, MatchStatus } from "@/types";
import { convertDateToString } from "@/lib/utils";

// https://api.football-data.org/v4/competitions/EC/matches?matchday=1

export async function getGames(matchday?: number, from?: Date, to?: Date, status?: MatchStatus): Promise<{
  data: FootballData;
  controller: AbortController;
}> {
  const controller = new AbortController();
  const dateFormat: string = "yyyy-MM-dd";
  
  const params = {
    ...(matchday !== undefined && { matchday }),
    ...(from && { dateFrom: convertDateToString(from, dateFormat) }),
    ...(to && { dateTo: convertDateToString(to, dateFormat) }),
    ...(status !== undefined && { status: MatchStatus[status] })
  };
  
  const response = await api.get<FootballData>('/v4/competitions/EC/matches', {
    params,
    signal: controller.signal
  });
  return { data: response.data, controller };
}

export async function getECCompetition(): Promise<{
  data: CompetitionData,
  controller: AbortController
}> {
  const controller = new AbortController();
  const response = await api.get("/v4/competitions/EC", {
    signal: controller.signal
  });
  return { data: response.data, controller };
}

