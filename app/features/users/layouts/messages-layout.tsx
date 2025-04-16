/* Sidebar 를 사용하려면 상위에 SidebarProvider 컴포넌트가 Sidebar를 감싸고 있어야 한다.
 */
/* [vite] Internal server error: [vite] The requested module 'class-variance-authority' does not provide an export named 'VariantProps'
sidebar 불러오기 시 이런 에러 메시지 뜨면 sibebar.tsx에서 import { type VariantProps, cva } from "class-variance-authority";
이런식으로 VariantProps에 타입 붙여주면 됩니다.*/
import { Outlet, useOutletContext } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarProvider,
} from "~/common/components/ui/sidebar";
import { MessageCard } from "~/features/users/components/message-card";
import type { Route } from "./+types/messages-layout";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId, getMessages } from "../queries";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = await makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const messages = await getMessages(client, { userId });
  return { messages };
};

//메시지만 보여주는게 아니라 너가 보낸건지 상대방이 보낸건지 구분해서 보여주면 좋음(#10.2)
export default function MessagesLayout({ loaderData }: Route.ComponentProps) {
  const { userId, name, avatar } = useOutletContext<{
    userId: string;
    avatar: string;
    name: string;
  }>();
  return (
    <SidebarProvider className="max-h-[calc(100vh-14rem)] overflow-hidden min-h-full h-[calc(100vh-14rem)]">
      {/* 가운데 부분을 보면 스크롤이 가능한데 좋아 보이지 않는다. 스크롤 되는 이유가 overflow 때문임. 패딩 py-28이 14rem이므로 14rem만큼 빼줌
      사이드바의 높이를 사용자 화면 크기에서 14rem을 뺀 값으로 설정. 14rem은 우리가 body에 추가했던 위아래 패딩 값임
      max-h-[calc(100vh-14rem)], h-[calc(100vh-14rem)] 둘다 있어야함. 그렇게 해야 messages-page에서 사이드바 높이가 적용됨
      messages-page가 화면 전체를 차지하게 만들고 싶은데, 그러려면 messagesPage가 h-full로 설정되어야 하고,
      MessagePage(채팅방)도 마찬가지로 높이가 100% 여야 하는데, 높이가 100% 되려면 상위에 있는 부모요소가 특정 높이값을 가지고 있어야함
      따라서 SidebarProvider가 max-h뿐만 아니라 h값도 가지고 있어야함
      */}
      {/* 조금 내리기 위해서 padding top 줌 */}
      <Sidebar variant="floating" className="pt-16" side="left">
        <SidebarContent className="pr-5">
          <SidebarGroup>
            <SidebarMenu>
              {loaderData.messages.map((message) => (
                <MessageCard
                  key={message.message_room_id}
                  id={message.message_room_id.toString()}
                  avatarUrl={message.avatar}
                  avatarFallback={message.name[0]}
                  name={message.name}
                  lastMessage={message.last_message}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="ml-50 w-full h-full">
        {/* route에 따라 달라지는 부분이 사이드바 옆에 표시됨 */}
        <Outlet context={{ userId, name, avatar }} />
      </div>
    </SidebarProvider>
  );
}
