import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { cn } from "~/lib/utils";

interface MessageBubbleProps {
  content: string;
  avatarUrl?: string;
  avatarFallback?: string;
  isCurrentUser?: boolean;
  index?: number;
}

export default function MessageBubble({
  content,
  avatarUrl,
  avatarFallback = "UN",
  isCurrentUser = false,
}: MessageBubbleProps) {
  return (
    // html 태그를 수정하는게 아니라 순서만 뒤집는 거다(내가 보낸 메시지일 때)
    <div
      className={cn(
        "flex items-end gap-4",
        isCurrentUser && "flex-row-reverse"
      )}
    >
      <Avatar>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>
      {/* 이런 형태의 cn 문법도 있다 확인 */}
      <div
        className={cn({
          "rounded-md p-4 text-sm w-1/4": true,
          // 모서리 뾰족하게 만들기(말풍선 처럼)
          "bg-accent rounded-br-none": isCurrentUser,
          "bg-primary text-primary-foreground rounded-bl-none": !isCurrentUser,
        })}
      >
        <p>{content}</p>
      </div>
    </div>
  );
}
