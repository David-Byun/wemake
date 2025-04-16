import { DotIcon, MessageCircleIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Form, Link, useActionData, useOutletContext } from "react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import { Textarea } from "~/common/components/ui/textarea";
import type { action } from "../pages/post-page";

interface ReplyProps {
  name: string;
  username: string;
  avatarUrl: string | null;
  content: string;
  timestamp: string;
  topLevel: boolean;
  topLevelId: number;
  replies?: {
    post_reply_id: number;
    reply: string;
    created_at: string;
    user: {
      name: string;
      avatar: string | null;
      username?: string;
    };
  }[];
}

export default function Reply({
  name,
  username,
  avatarUrl,
  content,
  timestamp,
  topLevel,
  topLevelId,
  replies,
}: ReplyProps) {
  /*대댓글도 페이지 새로고침으로 입력란을 초기화시키기 위해서 post페이지에서의 actionData를 보낼 필요 없이 useActionData를 사용해서
  가장 최근의 POST navigation form 제출의 actionData를 반환한다(#8.4) type은 가져올 페이지의 것을 import 해서 사용
  useActionData를 이용해서 에러를 표시할 수도 있음
  */
  const actionData = useActionData<typeof action>();
  const [replying, setReplying] = useState(false);
  const toggleReplying = () => setReplying((prev) => !prev);
  const {
    isLoggedIn,
    name: loggedInName,
    avatar,
  } = useOutletContext<{
    isLoggedIn: boolean;
    name: string;
    avatar: string;
  }>();
  //아래처럼 하면 대댓글 창을 닫아버리기 때문에 post 페이지에서 했던 것처럼 ref를 만들 필요가 없음
  useEffect(() => {
    if (actionData?.ok) {
      setReplying(false);
    }
  }, [actionData]);
  return (
    <div className="flex flex-col gap-2w-full">
      <div className="flex items-start gap-5">
        <Link to={`/users/${username}`}>
          <Avatar className="size-14">
            <AvatarFallback>{name[0]}</AvatarFallback>
            {avatarUrl && <AvatarImage src={avatarUrl} />}
          </Avatar>
        </Link>
        <div className="flex flex-col gap-2 items-start w-full">
          <div className="flex items-center gap-2">
            <Link to={`/users/${username}`} className="hover:underline">
              <h4>{name}</h4>
            </Link>
            <DotIcon className="size-5" />
            <span className="text-sm text-muted-foreground">
              {DateTime.fromISO(timestamp, { zone: "utc" }).toRelative()}
            </span>
          </div>
          <p className="text-muted-foreground">{content}</p>
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon"
              className="self-end"
              onClick={toggleReplying}
            >
              <MessageCircleIcon className="size-4" />
              Reply
            </Button>
          )}
        </div>
      </div>
      {replying && (
        // 대댓글 달아도 post 되는 주소가 다르기 때문에 대댓글이 아니라 댓글형태로 됨. 따라서 input hide를 이용한 트릭 사용(#8.4)
        <Form method="post" className="flex items-start gap-5 w-3/4">
          {/* input의 value값이 우리가 action에서 데이터를 받을 때 formData에 나타남(#8.4) */}
          <input type="hidden" name="topLevelId" value={topLevelId} />
          <Avatar className="size-14">
            <AvatarFallback>{loggedInName[0]}</AvatarFallback>
            <AvatarImage src={avatar} />
          </Avatar>
          <div className="flex flex-col gap-5 items-end w-full">
            <Textarea
              autoFocus
              name="reply"
              placeholder="Write a reply"
              className="w-full resize-none"
              defaultValue={`@${username}`}
              rows={5}
            />
            <Button>Reply</Button>
          </div>
        </Form>
      )}

      {topLevel && replies && (
        <div className="pl-20 w-full">
          {replies?.map((reply) => (
            // 답댓글이 또 다른 댓글을 포함하는건 원하지 않기 때문에 replies={reply.post_replies}는 없어야 함
            <Reply
              name={reply.user.name}
              username={reply.user.username}
              avatarUrl={reply.user.avatar}
              content={reply.reply}
              timestamp={reply.created_at}
              topLevel={false}
              topLevelId={topLevelId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
