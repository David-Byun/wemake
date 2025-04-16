import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/community-page";
import { Await, data, Form, Link, useSearchParams } from "react-router";
import { Button } from "~/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "~/common/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { PERIOD_OPTIONS, SORT_OPTIONS } from "../constants";
import { Input } from "~/common/components/ui/input";
import { PostCard } from "../components/post-card";
import { getPosts, getTopics } from "../queries";
import { Suspense } from "react";
import { z } from "zod";
import { makeSSRClient } from "~/supa-client";
/* #6.2*/
const searchParamsSchema = z.object({
  sorting: z.enum(["newest", "popular"]).optional().default("newest"),
  period: z
    .enum(["all", "today", "week", "month", "year"])
    .optional()
    .default("all"),
  keyword: z.string().optional(),
  topics: z.string().optional(),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  /* 
    현재 아래 구조 에서는 topics 데이터 가져오고 posts 데이터 가져오는데 비효율적이다(#5.8) 
    const topics = await getTopics();
    const posts = await getPosts();
    아래 구조는 getTopics() 와 getPosts() 가 동시에 실행되어 데이터를 가져오기 때문에 효율적이다.
    const [topics, posts] = await Promise.all([getTopics(), getPosts()]);
  */
  // 아래 방법은 해당 페이지에서 로딩하기 위해서 하는 방법 await를 빼준다(#5.8) UI에서 처리해줘야함
  //const topics = getTopics();
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  if (!success) {
    throw data({
      error: "Invalid search params",
      status: 400,
    });
  }
  const [topics, posts] = await Promise.all([
    getTopics(client),
    getPosts(client, {
      limit: 20,
      sorting: parsedData.sorting,
      period: parsedData.period,
      keyword: parsedData.keyword,
      topics: parsedData.topics,
    }),
  ]);
  return { topics, posts };
};

/* #5.10
  client 에서 loader 하기
  이렇게 하는것 만으로도 이 fetch와 function들은 browser에서 실행됨
  export const clientLoader = async () => {
    const [topics, posts] = await Promise.all([getTopics(), getPosts()]);
    return { topics, posts };
  };

  
#5.10 
clientLoader를 사용하려면 env값들을 직접 값으로 변경해줘야함(supa-client.ts 수정)
const client = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

이 경우 로딩중처리할 때 사용하는 방법 : clientLoader가 실행중일 때 React router가 이것을 보여줌
export function HydrateFallback() {
  return <div>Loading...</div>;
}

server loader에서 보낸 데이터를 clientLoader에서도 받아올 수 있음
대부분은 loader, clientLoader 중에 하나를 사용함
export const loader = async () => {
  return {
    secret : "secret"
  }
}

export const clientLoader = async ({serverLoader} : Route.ClientLoaderArgs) => {
  const serverData = await serverLoader();
  return serverData;
}
*/
/* #5.11 여러분의 모든 페이지에서 ErrorBoundary를 사용할 수 있음 : error처리는 직접해야함
여러분의 loader 안에 있는 function에서 error를 throw 하면 그 error는 여러분의 ErrorBoundary에서 잡힘
직접 ErrorBoundary를 만들어서 처리하지 않으면 root.tsx ErrorBoundary에서 처리함
ex)
export const getTopics = async () => {
  if(error) throw new Error(error.message);
  return topics;
}
*/
export function ErrorBoundary() {
  return <div>Error</div>;
}

export function meta({}: Route.MetaFunction) {
  return [
    {
      title: "Community",
      description: "Join our community discussions",
    },
  ];
}

export default function CommunityPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sorting = searchParams.get("sorting") || "newest";
  const period = searchParams.get("period") || "all";
  const { topics, posts } = loaderData;
  return (
    <div>
      <PageHeader title="Community" subtitle="Community discussions" />
      <div className="grid grid-cols-6 items-start gap-40">
        <div className="col-span-4 space-y-10">
          <div className="flex justify-between">
            <div className="space-y-5 w-full">
              <div className="flex items-center gap-5">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <span className="text-sm capitalize">{sorting}</span>
                    <ChevronDownIcon className="size-5" />
                  </DropdownMenuTrigger>
                  {/* constants를 만들 때라고 생각함 */}
                  <DropdownMenuContent>
                    {SORT_OPTIONS.map((option) => (
                      // tailwindcss : capitalize 는 소문자 단어의 첫번째 글자를 대문자로 만들어 줌
                      <DropdownMenuCheckboxItem
                        className="capitalize cursor-pointer"
                        key={option}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            searchParams.set("sorting", option);
                            setSearchParams(searchParams);
                          }
                        }}
                      >
                        {option}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {sorting === "popular" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <span className="text-sm capitalize">{period}</span>
                      <ChevronDownIcon className="size-5" />
                    </DropdownMenuTrigger>
                    {/* constants를 만들 때라고 생각함 */}
                    <DropdownMenuContent>
                      {PERIOD_OPTIONS.map((period) => (
                        // tailwindcss : capitalize 는 소문자 단어의 첫번째 글자를 대문자로 만들어 줌
                        <DropdownMenuCheckboxItem
                          className="capitalize cursor-pointer"
                          key={period}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              searchParams.set("period", period);
                              setSearchParams(searchParams);
                            }
                          }}
                        >
                          {period}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {/* form은 기본적으로 'get' */}
              <Form className="w-2/3">
                <Input type="text" name="keyword" placeholder="Search" />
              </Form>
            </div>
            <Button asChild>
              <Link to="/community/submit">New Post</Link>
            </Button>
          </div>
          {/* 아래에서 만든 Await를 Suspense로 감싸서 fallback으로 Loading div라든지 원하는 animation을 보여줄 수 있음(#5.8)*/}
          <Suspense fallback={<div>Loading...</div>}>
            <Await resolve={posts}>
              {(data) => (
                <div className="space-y-5">
                  {data.map((post) => (
                    /* view에서 불러온 데이터를 사용할때 nullable 를 return 하는데 string 값만 있어야 하므로 에러가 발생할 수 있다. 
              첫번째 해결방법 : ex) post.post_id!
              두번째 해결방법 : ex) post.post_id ?? "default"
              */
                    <PostCard
                      id={post.post_id}
                      title={post.title}
                      author={post.author_username}
                      category={post.topic}
                      //날짜는 database에서 string 형식으로 저장되어 있음
                      createdAt={post.created_at}
                      authorAvatarUrl={post.author_avatar}
                      key={post.post_id}
                      expanded={true}
                      upvotes={post.upvotes}
                      isUpvoted={post.is_upvoted}
                    />
                  ))}
                </div>
              )}
            </Await>
          </Suspense>
        </div>
        <aside className="col-span-2 space-y-5">
          <span className="text-sm font-bold text-muted-foreground uppercase">
            Topics
          </span>

          {/* 아래에서 만든 Await를 Suspense로 감싸서 fallback으로 Loading div라든지 원하는 animation을 보여줄 수 있음(#5.8)*/}
          <Suspense fallback={<div>Loading...</div>}>
            {/* 해당 페이지에서 로딩하기 위해서 Await를 활용하여 데이터를 감싸준다(#5.8) 
              Await component는 topics function을 await 한다. await하고 완료되었을때 그 결과인 데이터를 우리에게 준다. */}
            <Await resolve={topics}>
              {(data) => (
                <div className="flex flex-col gap-2 mt-4 items-start">
                  {data.map((topic) => (
                    <Button
                      asChild
                      variant="link"
                      key={topic.slug}
                      className="pl-0"
                    >
                      <Link to={`/community?topics=${topic.slug}`}>
                        {topic.topic}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </Await>
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
