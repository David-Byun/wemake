import { AvatarImage } from "@radix-ui/react-avatar";
import { UserRoundIcon } from "lucide-react";
import { Link } from "react-router";
import { Avatar, AvatarFallback } from "~/common/components/ui/avatar";
import { Badge } from "~/common/components/ui/badge";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";

interface TeamCardProps {
  id: number;
  leaderName: string;
  leaderAvatarUrl: string | null;
  projectDescription: string;
  positions: string[];
}

export function TeamCard({
  id,
  leaderName,
  leaderAvatarUrl,
  projectDescription,
  positions,
}: TeamCardProps) {
  return (
    <Link to={`/teams/${id}`} className="block">
      <Card className="bg-transparent hover:bg-card/50 transition-colors h-full flex flex-col">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="text-base leading-loose">
            <Badge variant="secondary">
              <span>@{leaderName}</span>
              <Avatar className="size-5">
                {leaderAvatarUrl ? (
                  <AvatarImage src={leaderAvatarUrl} />
                ) : (
                  <AvatarFallback>
                    <UserRoundIcon />
                  </AvatarFallback>
                )}
              </Avatar>
            </Badge>
            <span> is looking for</span>
            {positions.map((position) => (
              <Badge key={position} className="text-base">
                {position}
              </Badge>
            ))}
            <span> to build </span>
            <span>{projectDescription}</span>
          </CardTitle>
        </CardHeader>
        <CardFooter className="justify-end">
          <Button variant="link" asChild>
            Join team &rarr;
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
