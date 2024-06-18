import { useEffect, useState } from "react";
import { getGames } from "@/services/api";
import { Match, MatchStatus, Team } from "@/types";
import { GameCard } from "@components/game-card";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

interface GameListProps {
  matchday?: number;
}

export function GameList({ }: GameListProps) {

  const [matches, setMatches] = useState<Match[]>([]);

  const [isSheetOpen, setSheetOpen] = useState<boolean>(false);
  const [matchClicked, setMatchClicked] = useState<Match | null>(null);
  const [teamClicked, setTeamClicked] = useState<Team | null>(null);

  const [predictionAmmount, setPredictionAmmount] = useState<number>(0);

  useEffect(() => {
    let controller: AbortController;
    const fetchGames = async () => {
      try {
        const result = await getGames(undefined, undefined, undefined, MatchStatus.SCHEDULED);
        controller = result.controller;

        // Only show games/matches that have been determined from previous stages
        const determinedMatches = result.data.matches.filter((m) => m.group != null);
        setMatches(determinedMatches);
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
  }, []);

  const onTeamClick = (match: Match, team: Team) => {
    setMatchClicked(match);
    setTeamClicked(team);

    setSheetOpen(true);
  };

  const placePrediction = () => {
    
  }

  const updatePredictionAmmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: number = event.target.value as any;
    if (value < 0) {
      setPredictionAmmount(0);
      return;  
    }
    setPredictionAmmount(value);
  }

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Predict {teamClicked?.name} to win ?</SheetTitle>
            <SheetDescription>
              This action cannot be undone. Make sure you check the ammount you want to check.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Wager
              </Label>
              <Input id="name" type="number" className="col-span-3" value={predictionAmmount} onChange={updatePredictionAmmount} />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit" onClick={placePrediction}>Place Prediction</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {
        matches?.map((game, index) => (
          <GameCard match={game} key={index} onTeamClick={onTeamClick} />
        ))
      }
    </>
  );
}