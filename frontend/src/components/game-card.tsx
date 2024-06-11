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

interface GameCardProps {
  home: string;
  away: string;
  date: string;
}

export function GameCard({ home, away, date }: GameCardProps) {
  return (
    <Card className="w-[450px]">
      <CardHeader className="flex items-center">
        <CardTitle>{home} x {away}</CardTitle>
        <CardDescription>{date}</CardDescription>
        <Separator />
      </CardHeader>
      <CardContent className="flex justify-between">
        <Button variant="constructive">{home} to win</Button>
        <Button variant="destructive">{away} to win</Button>        
      </CardContent>
    </Card>
  );
}