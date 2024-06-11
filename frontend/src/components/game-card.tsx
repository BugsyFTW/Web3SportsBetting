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
import { Team } from "@/types";

interface GameCardProps {
  home: Team;
  away: Team;
  date: Date;
}

export function GameCard({ home, away, date }: GameCardProps) {

  const formatDate = (date: Date) => {
    // Format the date part
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };

    const formattedDate = date.toLocaleDateString('en-US', dateOptions);

    // Format the time part
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

    // Combine date and time with the desired separator
    return `${formattedDate} @ ${formattedTime}`;
  };

  // Ensure date is a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return (
    <Card className="w-[450px]">
      <CardHeader className="flex items-center">
        <CardTitle className="flex items-center">
          <TeamCrest className="mr-4" crest={home.crest} shortName={home.shortName} />
          {home.name} x {away.name}
          <TeamCrest className="ml-4" crest={away.crest} shortName={away.shortName} />
        </CardTitle>
        <CardDescription>{formatDate(dateObj)}</CardDescription>
        <Separator />
      </CardHeader>
      <CardContent className="flex justify-between">
        <Button variant="constructive">{home.name} to win</Button>
        <Button variant="destructive">{away.name} to win</Button>
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