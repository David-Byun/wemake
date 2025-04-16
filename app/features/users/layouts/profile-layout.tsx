import { Form, Link, NavLink, Outlet, useOutletContext } from "react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { Badge } from "~/common/components/ui/badge";
import { Button, buttonVariants } from "~/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/common/components/ui/dialog";
import { Textarea } from "~/common/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/profile-layout";
import { getUserProfile } from "../queries";
import { makeSSRClient } from "~/supa-client";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const user = await getUserProfile(client, {
    username: params.username!,
  });
  return { user };
};

//useOutletContext hook을 사용. Outlet의 context에서 데이터를 가져오기 위함. root.tsx (#8.9)
export default function ProfileLayout({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { isLoggedIn, username } = useOutletContext<{
    isLoggedIn: boolean;
    username?: string;
  }>();
  return (
    // 헤더
    <div className="space-y-10 ">
      {/* 라우팅 경로에 따라서 달라지는 부분이 Outlet 부분에 채워지게 됨 */}
      <div className="flex items-center gap-4">
        <Avatar className="size-40">
          {loaderData.user.avatar && (
            <AvatarImage src={loaderData.user.avatar} />
          )}
          <AvatarFallback className="text-2xl">
            {loaderData.user.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-4">
          <div className="flex gap-2">
            <h1 className="text-2xl font-semibold">{loaderData.user.name}</h1>
            {/* 프로필을 보는 사람이 나 자신이면 버튼 노출 */}
            {isLoggedIn && username === params.username && (
              <Button variant="outline" asChild>
                <Link to="/my/settings">Edit profile</Link>
              </Button>
            )}
            {/* link 태그없어서 asChild 제거 */}
            {isLoggedIn && username !== params.username && (
              <Button variant="secondary">Follow</Button>
            )}
            {isLoggedIn && username !== params.username && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Message</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Message</DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="space-y-4">
                    <span className="text-sm text-muted-foreground">
                      Send a message to John Doe
                    </span>
                    <Form className="space-y-4">
                      <Textarea
                        placeholder="Message"
                        className="resize-none"
                        rows={4}
                      />
                      <Button type="submit">Send</Button>
                    </Form>
                  </DialogDescription>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              @{loaderData.user.username}
            </span>
            <Badge variant="secondary">{loaderData.user.role}</Badge>
            <Badge variant="secondary">100 followers</Badge>
            <Badge variant="secondary">100 following</Badge>
          </div>
        </div>
      </div>
      {/* product-overview-layout에서 NavLink라는 컴포넌트 사용한 것 가져오기 */}
      <div className="flex gap-5">
        {[
          { label: "About", to: `/users/${loaderData.user.username}` },
          {
            label: "Products",
            to: `/users/${loaderData.user.username}/products`,
          },
          { label: "Posts", to: `/users/${loaderData.user.username}/posts` },
        ].map((item) => (
          /* 최초 about 버튼을 눌러도 왜 계속 활성화 상태인지 생각해보면 NavLink가 현재 경로를 바라볼 때 
          to에 들어온 값이 현재 경로와 일치 하는지 혹은 포함하는지를 확인해서 일치하면 isActive값은 true가 됨
          다만 모든 url이 /users/username으로 시작하기에 NavLink는 URL이 여전이 active라고 생각한다. 이를 방지하려면 end를 추가함
          end 마우스 올려서 봐볼것!
          */
          <NavLink
            end
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: "outline" }),
                isActive && "bg-accent text-muted-foreground"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="max-w-screen-md">
        {/* Outlet 컴포넌트 자리에 하위 페이지가 보임 */}
        <Outlet
          context={{
            headline: loaderData.user.headline,
            bio: loaderData.user.bio,
          }}
        />
      </div>
    </div>
  );
}
