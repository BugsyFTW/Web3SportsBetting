import { useEffect, useState } from "react";
import { getGames } from "@/services/api";
import { FootballData } from "@/types";
import { GameCard } from "@components/game-card";

interface GameListProps { 
  matchday: number;
}

export function GameList({ matchday }: GameListProps) {

  const [games, setGames] = useState<FootballData | null>(null);

  useEffect(() => {
    let controller: AbortController;
    const fetchGames = async () => {
      try {
        const result = await getGames(matchday);
        controller = result.controller;
        setGames(result.data);
      } catch (error) {
        console.error("Error fetching games: ", error);
      }
    };
    fetchGames();
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [matchday]);

  return (
    <>
      {
        games?.matches.map((game) => (
          <GameCard home={game.homeTeam} away={game.awayTeam} date={game.utcDate} />
        ))
      }
    </>
  );
}