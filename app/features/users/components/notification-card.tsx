import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { EyeIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Link, useFetcher } from "react-router";

interface NotificationCardProps {
  avatarUrl?: string;
  avatarFallback: string;
  userName: string;
  type: "review" | "follow" | "reply";
  timestamp: string;
  seen: boolean;
  productName?: string;
  postTitle?: string;
  payloadId?: number;
  id: number;
}

export function NotificationCard({
  avatarUrl,
  avatarFallback,
  userName,
  timestamp,
  type,
  seen,
  productName,
  postTitle,
  payloadId,
  id,
}: NotificationCardProps) {
  const getMessage = (type: NotificationCardProps["type"]) => {
    switch (type) {
      case "review":
        return " reviewed your product : ";
      case "follow":
        return " followed you : ";
      case "reply":
        return " replied to your post : ";
    }
  };
  const fetcher = useFetcher();
  //optimistic은 사용자 경험을 위해서 필수!
  const optimisticSeen = fetcher.state === "idle" ? seen : true;

  return (
    <Card
      className={cn("min-w-[450px]", optimisticSeen ? "" : "bg-yellow-500/50")}
    >
      <CardHeader className="flex flex-row gap-5 items-start">
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-bold">
            <span className="font-bold">{userName}</span>
            <span className="text-muted-foreground"> {getMessage(type)}</span>
            {productName && (
              <Button variant={"ghost"} className="text-lg" asChild>
                <Link to={`/products/${payloadId}`}>{productName}</Link>
              </Button>
            )}
            {postTitle && (
              <Button variant={"ghost"} className="text-lg" asChild>
                <Link to={`/community/${payloadId}`}>{postTitle}</Link>
              </Button>
            )}
          </CardTitle>
          <small className="text-muted-foreground text-sm">{timestamp}</small>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-end">
        {optimisticSeen ? null : (
          <fetcher.Form method="post" action={`/my/notifications/${id}/see`}>
            <Button variant="outline" size="icon">
              <EyeIcon className="size-4" />
            </Button>
          </fetcher.Form>
        )}
      </CardFooter>
    </Card>
  );
}
