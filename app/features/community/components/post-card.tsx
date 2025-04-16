import { AvatarImage } from "@radix-ui/react-avatar";
import { ChevronUpIcon } from "lucide-react";
import { Link, useFetcher } from "react-router";
import { Avatar, AvatarFallback } from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { cn } from "~/lib/utils";

interface PostCardProps {
  id: number;
  title: string;
  author: string;
  category: string;
  createdAt: string;
  authorAvatarUrl: string | null;
  expanded?: boolean;
  upvotes?: number;
  isUpvoted?: boolean;
}

export function PostCard({
  id,
  title,
  author,
  category,
  createdAt,
  authorAvatarUrl,
  expanded = false,
  upvotes = 0,
  isUpvoted = false,
}: PostCardProps) {
  const fetcher = useFetcher();
  /* 기본적으로 알고 싶은 것은 fetcher의 상태다. fetcher가 submit을 하는중인지 무슨일이 일어나고 있는지 말야. 
  fetcher.state는 3가지 상태가 있고, fetcher.state를 통해서 알 수 있다.
  idle: 아무것도 일어나지 않음
  loading: 데이터를 불러오는 중
  submitting: 데이터를 제출하는 중
  */
  //fetcher가 idle이 아니라면 그것은 우리가 추천 작업을 진행중이라는 뜻이다. 만약 우리가 추천하지 않았고 fetcher가 idle이 아니라면,
  //그것은 우리가 이것을 추천하고 있다는 뜻
  const optimisticVotesCount =
    fetcher.state === "idle" ? upvotes : isUpvoted ? upvotes - 1 : upvotes + 1;
  const optimisticIsUpvoted = fetcher.state === "idle" ? isUpvoted : !isUpvoted;
  const absorbClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // call the upvote action
    fetcher.submit(
      // { postId: id },
      null,
      {
        method: "post",
        action: `/community/${id}/upvote`,
      }
    );
  };
  return (
    /* #9.2 카드 영역에서는 상세페이지로 가지만 upvote 버튼을 눌렀을때 나는 navigation이 일어나는 것을 멈추고 싶고 추천한 것을 기록하고 싶다. 
    1. 우리가 먼저 할 일은 upvote 클릭을 흡수하는 것이다.
    2. 버튼에 대한 onClick eventListener를 추가한다. 버튼 클릭했을 때 기본적으로 browser가 원래 해야 하는 페이지로 이동하는 일을 하지 못하게 막는다.
    form 말고 다른 방법임
    */
    <Link to={`/community/${id}`} className="block">
      <Card
        className={cn(
          "bg-transparent hover:bg-card/50 transition-colors",
          expanded ? "flex flex-row items-center justify-between" : ""
        )}
      >
        <CardHeader className="flex flex-row items-center gap-2">
          <Avatar className="size-14">
            <AvatarImage src={authorAvatarUrl ?? ""} />
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <div className="flex gap-2 text-sm leading-tight text-muted-foreground">
              <span>{author} on</span>
              <span>{category}</span>
              <span>・</span>
              <span>
                {new Date(createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardHeader>
        {!expanded && (
          <CardFooter className="flex justify-end">
            <Button variant="link">Reply &rarr;</Button>
          </CardFooter>
        )}
        {expanded && (
          <CardFooter className="flex justify-end pt-0 pb-0">
            <Button
              onClick={absorbClick}
              variant="outline"
              className={cn(
                "flex h-14 flex-col",
                optimisticIsUpvoted ? "bg-primary text-primary-foreground" : ""
              )}
            >
              <ChevronUpIcon className="size-4 shrink-0" />
              <span>{optimisticVotesCount}</span>
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
