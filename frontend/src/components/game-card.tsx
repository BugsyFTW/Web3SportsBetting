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
  date: string;
}

export function GameCard({ home, away, date }: GameCardProps) {
  return (
    <Card className="w-[450px]">
      <CardHeader className="flex items-center">
        <CardTitle className="flex items-center">
          <TeamCrest className="mr-4" crest={home.crest} shortName={home.shortName} />
          {home.name} x {away.name}
          <TeamCrest className="ml-4" crest={away.crest} shortName={away.shortName} />
        </CardTitle>
        <CardDescription>{date}</CardDescription>
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