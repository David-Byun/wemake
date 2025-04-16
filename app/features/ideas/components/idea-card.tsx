import { Link } from "react-router";
import { DotIcon, EyeIcon, HeartIcon, LockIcon } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { cn } from "~/lib/utils";
import { DateTime } from "luxon";

interface IdeaCardProps {
  id: string;
  title: string;
  views?: number;
  likes?: number;
  createdAt?: string;
  claimed?: boolean;
  owner?: boolean;
}

export function IdeaCard({
  id,
  title,
  views,
  likes,
  createdAt,
  claimed,
  owner,
}: IdeaCardProps) {
  return (
    <Card className="bg-transparent hover:bg-transparent/50 transition-colors">
      <CardHeader>
        <Link to={claimed || owner ? "" : `/idea/${id}`}>
          <CardTitle className="text-xl">
            <span
              // breakall : 모든 단어에 줄바꿈을 추가
              className={cn(
                claimed
                  ? "bg-muted-foreground selection:bg-muted-foreground text-muted-foreground break-all"
                  : ""
              )}
            >
              {title}
            </span>
          </CardTitle>
        </Link>
      </CardHeader>
      {owner ? null : (
        <CardContent className="flex items-center text-sm">
          <div className="flex items-center gap-1">
            <EyeIcon className="size-4" />
            <span>{views}</span>
          </div>
          <DotIcon className="size-4" />
          {/* DateTime.fromISO(createdAt).toRelative() ~일전, ~몇시간전 이런 형태*/}
          {createdAt ? (
            <span>{DateTime.fromISO(createdAt).toRelative()}</span>
          ) : null}
        </CardContent>
      )}
      <CardFooter className="flex justify-end gap-2">
        {!claimed && !owner ? (
          <>
            <Button variant="outline">
              <HeartIcon className="size-4" />
              <span>{likes}</span>
            </Button>
            <Button asChild>
              <Link to={`/ideas/${id}/claim`}>Claim idea now &rarr;</Link>
            </Button>
          </>
        ) : (
          <Button variant="outline" className="cursor-not-allowed">
            <LockIcon className="size-4" />
            Claimed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
