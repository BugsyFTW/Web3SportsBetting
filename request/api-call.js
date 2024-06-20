const Result = {
  None: 0,
  Home: 1,
  Away: 2,
};

const matchId = args[1];

if (secrets.apiKey == "") {
  throw Error(
    "API_KEY environment variable not set for Football API. Get a free key from https://www.football-data.org/"
  );
}

if (Object.values(CompetitionType).indexOf(competitionId) == -1) {
  throw Error("Invalid CompetitionID");
}
if (matchId == "" || matchId == "0") {
  throw Error("Invalid Match ID");
}

const baseUrl = "https://api.football-data.org/v4/matches";

const fetchMatchData = async (id) => {
  const response = await Functions.makeHttpRequest({
    url: `${baseUrl}/${id}`,
    headers: { "X-Auth-Token": secrets.apiKey }
  });
  if (response.status !== 200) {
    throw new Error(`Status ${response.status}! ${response.data.message}`);
  }
  return response.data;
}

const getGameResult = async (id) => {
  const data = await fetchMatchData(id);
  if (data.status != "FINISHED") {
    throw new Error(`Game #${id} has not finished!`);
  }
  const winner = getGameWinner(data);

  Functions.encodeUint256(winner);
};

const getGameWinner = (data) => {
  return data.score.winner === "HOME_TEAM" ? Result.Home : Result.Away;
};

return getGameResult(matchId);