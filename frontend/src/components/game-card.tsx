import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card"

import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
import { Match, Team } from "@/types";

interface GameCardProps {
  match: Match;
  onTeamClick: (match: Match, team: Team) => void;
}

export function GameCard({ match, onTeamClick }: GameCardProps) {

  const formatDate = (date: Date) => {
    const locale = navigator.language;
    // Format the date part
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };

    const formattedDate = date.toLocaleDateString(locale, dateOptions);

    // Format the time part
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    const formattedTime = date.toLocaleTimeString(locale, timeOptions);

    // Combine date and time with the desired separator
    return `${formattedDate} @ ${formattedTime}`;
  };

  // Ensure date is a Date object
  const dateObj = typeof match.utcDate === 'string' ? new Date(match.utcDate) : match.utcDate;

  return (
    <Card className="w-[450px]">
      <CardHeader className="flex items-center">
        <CardTitle className="flex items-center">
          <TeamCrest className="mr-4" crest={match.homeTeam.crest} shortName={match.homeTeam.shortName} />
          {match.homeTeam.name} x {match.awayTeam.name}
          <TeamCrest className="ml-4" crest={match.awayTeam.crest} shortName={match.awayTeam.shortName} />
        </CardTitle>
        <CardDescription>{formatDate(dateObj)}</CardDescription>
        <Separator />
      </CardHeader>
      <CardContent className="flex justify-between">
        <Button variant="constructive" onClick={() => onTeamClick(match, match.homeTeam)}>{match.homeTeam.name} to win</Button>
        <Button variant="destructive"  onClick={() => onTeamClick(match, match.awayTeam)}>{match.awayTeam.name} to win</Button>
      </CardContent>
    </Card>
  );
}

interface TeamCrestProps {
  crest: string;
  shortName: string;
  className: string;
}

export function TeamCrest({ crest, shortName, className }: TeamCrestProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={crest} />
      <AvatarFallback>{shortName}</AvatarFallback>
    </Avatar>
  );
}