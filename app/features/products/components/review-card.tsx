import { StarIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "~/common/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { DateTime } from "luxon";

interface ReviewCardProps {
  authorName: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  content: string;
  createdAt: string;
}

export function ReviewCard({
  authorName,
  username,
  avatarUrl,
  rating,
  content,
  createdAt,
}: ReviewCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>{authorName[0]}</AvatarFallback>
          {avatarUrl && <AvatarImage src={avatarUrl} />}
        </Avatar>
        <div>
          <h4 className="text-lg font-bold">{authorName}</h4>
          <p className="text-sm text-muted-foreground">{username}</p>
        </div>
      </div>
      <div className="flex text-yellow-400">
        {Array.from({ length: rating }).map((_, index) => (
          <StarIcon key={index} className="size-4" fill="currentColor" />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{content}</p>
      <span className="text-sm text-muted-foreground">
        {DateTime.fromISO(createdAt).toRelative()}
      </span>
    </div>
  );
}
