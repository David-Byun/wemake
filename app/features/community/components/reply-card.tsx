import { Form, Link } from "react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import { DotIcon, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { Textarea } from "~/common/components/ui/textarea";

interface ReplyCardProps {
  content: string;
  username: string;
  avatarUrl: string;
  avatarFallback: string;
  postedAt: string;
  topLevel: boolean;
}

export function ReplyCard({
  content,
  username,
  avatarUrl,
  avatarFallback,
  postedAt,
  topLevel,
}: ReplyCardProps) {
  const [replying, setReplying] = useState(false);
  const toggleReplying = () => setReplying((prev) => !prev);
  return (
    <div className="flex flex-col gap-2">
      {/* 댓글 */}
      <div className="flex items-start gap-5 w-2/3 ">
        <Avatar className="size-14">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-4 items-start">
          <div className="flex items-center gap-2">
            <Link to={`/users/@${username}`}>
              <h4 className="font-medium">{username}</h4>
            </Link>
            <DotIcon className="size-5" />
            <span className="text-xs text-muted-foreground">{postedAt}</span>
          </div>
          <p className="text-muted-foreground">{content}</p>
          <Button variant="ghost" className="self-end" onClick={toggleReplying}>
            <MessageCircleIcon className="size-4" />
            Reply
          </Button>
        </div>
        {/* 여기서 체크하지 않으면 reply가 또 다른 reply를 계속 render 할 것이기 때문에 말이 안된다. */}
      </div>
      {/* 대댓글 */}
      {/* 
        아래 reply가 render 될 때는 topLevel 이 아니기 때문에 답글이 없으므로 답글이 render 되지 않음 
        이건 꼭 확인해야해 만약 그렇지 않으면 재귀때문에 웹사이트가 망가짐
      */}
      {replying && (
        <Form className="flex items-start gap-5">
          <Avatar className="size-14">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {/* 버튼이 늘어난 이는 flex flex-col을 사용하면 기본값으로 item-stretch가 들어가기 때문이다. */}
          <div className="flex flex-col gap-5 w-full items-end">
            <Textarea
              placeholder="Write a reply"
              className="w-full resize-none"
              rows={10}
            />
            <Button type="submit">Reply</Button>
          </div>
        </Form>
      )}
      {topLevel && (
        <div className="pl-7 w-full">
          <ReplyCard
            content="i've been using cursor for a while and it's really helpful for me. i've learned a lot from it. i've been using cursor for a while and it's really helpful for me. i've learned a lot from it."
            username="nico"
            avatarUrl="https://github.com/shadcn.png"
            avatarFallback="CN"
            postedAt="2 hours ago"
            topLevel={false}
          />
        </div>
      )}
    </div>
  );
}
