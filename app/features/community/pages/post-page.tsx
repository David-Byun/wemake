import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/common/components/ui/breadcrumb";
import type { Route } from "./+types/post-page";
import { Form, Link, useFetcher, useOutletContext } from "react-router";
import { Button } from "~/common/components/ui/button";
import { ChevronUpIcon, DotIcon } from "lucide-react";
import { Textarea } from "~/common/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { getPostById, getReplies } from "../queries";
import { DateTime } from "luxon";
import { cn } from "~/lib/utils";
import { Badge } from "~/common/components/ui/badge";
import Reply from "../components/reply";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";
import { z } from "zod";
import { createReply } from "../mutations";
import { useEffect, useRef } from "react";

export const meta: Route.MetaFunction = ({ params }) => {
  return [{ title: `${params.postId} | wemake` }];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  //여러분은 로딩 속도를 빠르게 하는 방법을 알고 있으니 프로덕션에서는 최적화 작업을 꼭 해라(#8.3)
  const post = await getPostById(client, { postId: Number(params.postId) });
  const replies = await getReplies(client, { postId: Number(params.postId) });
  return { post, replies };
};

// reply라는 하나의 값만 받아도 검증하는게 좋다(#8.3)
const formSchema = z.object({
  reply: z.string().min(1),
  topLevelId: z.coerce.number().optional(),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { data, success, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return {
      formError: error.flatten().fieldErrors,
    };
  }
  const { reply, topLevelId } = data;
  await createReply(client, {
    postId: params.postId,
    reply,
    userId,
    topLevelId,
  });
  return {
    ok: true,
  };
};

/*  #6.10 post page에 담겨야할 데이터가 많기 때문에 view 만듦 
     view 생성하고 npm run db:typegen 실행 */
export default function PostPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  //root.tsx 에서 outlet context로 넘겨준 데이터를 아래 처럼 받음. 로그인안할수도 있어서 물음표
  const { isLoggedIn, name, username, avatar } = useOutletContext<{
    isLoggedIn: boolean;
    name?: string;
    username?: string;
    avatar?: string;
  }>();
  // 역할 : 폼제출 후 폼 초기화(reset)
  const formRef = useRef<HTMLFormElement>(null);
  //특정 input 필드를 타겟팅하지 않고 form 전체를 초기화
  useEffect(() => {
    if (actionData?.ok) {
      formRef.current?.reset();
    }
  }, [actionData?.ok]);
  /* #9.1 여전히 action을 작동시키고 싶은데 URL은 변경하고 싶지 않다면 어떻게 해야 할까 ? (/community/postId/upvote) 
  Form을 fetcher.Form으로 바꾸면 된다.
  */
  const fetcher = useFetcher();
  return (
    <div className="space-y-10 grid grid-cols-1 md:block md:gap-0">
      <Breadcrumb className="w-full">
        <BreadcrumbList className="w-full">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/community">Community</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/community?topic=${loaderData.post.topic}`}>
                {loaderData.post.topic}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/community/postId`}>{loaderData.post.title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-1  md:grid-cols-6 gap-10 md:gap-40 items-start">
        <div className="md:col-span-4 space-y-10">
          <div className="flex w-full flex-col md:flex-row items-start gap-10">
            {/* #9.1  fetcher.Form : URL은 변경되지 않는다 */}
            <fetcher.Form
              method="post"
              className="w-full md:w-fit"
              action={`/community/${loaderData.post.post_id}/upvote`}
            >
              {/* #9.1 action으로 formData를 전달하는 방법 : hidden인 input을 만든다.*/}
              {/* ex) 퀴즈 앱을 만들고 있어서 일정 시간 이후 Form 을 submit하고 싶을 수 있다. form 없이 fetcher 하는 방법*/}
              {/* <input
                type="hidden"
                name="postId"
                value={loaderData.post.post_id}
              /> */}
              <Button
                variant="outline"
                className={cn(
                  "flex flex-col h-14 w-full md:w-fit",
                  loaderData.post.upvotes > 0
                    ? "border-primary text-primary"
                    : ""
                )}
              >
                <ChevronUpIcon className="size-4 shrink-0" />
                <span>{loaderData.post.upvotes}</span>
              </Button>
            </fetcher.Form>
            <div className=" space-y-10 md:space-y-20 w-full">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">{loaderData.post.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link
                    to={`/users/${loaderData.post.author_name}`}
                    className="hover:underline"
                  >
                    {loaderData.post.author_name}
                  </Link>
                  <DotIcon className="size-5" />
                  <span>
                    {DateTime.fromISO(loaderData.post.created_at, {
                      zone: "utc",
                    }).toRelative()}
                  </span>
                  <DotIcon className="size-5" />
                  <span>{loaderData.post.replies} replies</span>
                </div>
                <p className="text-muted-foreground w-full md:w-3/4">
                  {loaderData.post.content}
                </p>
              </div>
              {isLoggedIn ? (
                <Form
                  //새로고침해서 내용을 없애기 위해서 formRef 이용
                  ref={formRef}
                  className="flex items-start gap-5 w-full md:w-3/4"
                  method="post"
                >
                  {/* 만약 사용자가 로그인하지 않은 상태라면 작성창을 숨기거나 이 토론에 답글을 달려면 로그인하세요 같은 메시지를 보여줄 수 있다. 
                root.tsx 에서 로그인 여부를 알 수 있기 때문에 Outlet context로 넘겨줄 수 있다.(#8.3)
                */}
                  <Avatar className="size-14">
                    <AvatarFallback>{name?.[0]}</AvatarFallback>
                    <AvatarImage src={avatar} />
                  </Avatar>
                  <div className="flex flex-col gap-5 items-end w-full">
                    <Textarea
                      name="reply"
                      placeholder="Write a reply"
                      className="w-full resize-none"
                      rows={5}
                    />
                    <Button>Reply</Button>
                  </div>
                </Form>
              ) : null}

              <div className="space-y-10">
                <h4 className="font-semibold">
                  {loaderData.post.replies} Replies
                </h4>
                <div className="flex flex-col gap-5">
                  {loaderData.replies.map((reply) => (
                    <Reply
                      key={reply.post_reply_id}
                      name={reply.user.name}
                      username={reply.user.username}
                      avatarUrl={reply.user.avatar}
                      content={reply.reply}
                      timestamp={reply.created_at}
                      topLevel={true}
                      replies={reply.post_replies}
                      topLevelId={reply.post_reply_id}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className="md:col-span-2 space-y-5 border rounded-lg p-6 shadow-sm">
          <div className="flex gap-5">
            <Link to={`/users/${loaderData.post.author_name}`}>
              <Avatar className="size-14">
                <AvatarFallback>
                  {loaderData.post.author_name[0]}
                </AvatarFallback>
                {loaderData.post.author_avatar ? (
                  <AvatarImage src={loaderData.post.author_avatar} />
                ) : null}
              </Avatar>
            </Link>
            <div className="flex flex-col items-start">
              <Link
                to={`/users/${loaderData.post.author_name}`}
                className="hover:underline"
              >
                <h4 className="text-lg font-medium">
                  {loaderData.post.author_name}
                </h4>
              </Link>
              <Badge variant="secondary" className="capitalize">
                {loaderData.post.author_role}
              </Badge>
            </div>
          </div>
          <div className="gap-2 text-sm flex flex-col">
            <span>
              🎂 Joined{" "}
              {DateTime.fromISO(loaderData.post.author_created_at, {
                zone: "utc",
              }).toRelative()}{" "}
              ago
            </span>
            <span>🚀 Launched {loaderData.post.products} products</span>
          </div>
          <Button variant="outline">Follow</Button>
        </aside>
      </div>
    </div>
  );
}
{
  /* flex flex-col 하면 item-stretch가 들어가서 버튼이 자동적으로 늘어남. 그래서 초기값으로 items-start 또는 end 넣어줌 넣어줌*/
}
{
  /* gap과 space-x는 차이점이 있다. space x,y는 그냥 margin을 넣는거고 gap은 실제로 flex container 내부에서 동작하는 property다. */
}
