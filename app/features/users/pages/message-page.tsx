import { SendIcon } from "lucide-react";
import {
  Form,
  useOutletContext,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { Textarea } from "~/common/components/ui/textarea";
import MessageBubble from "../components/message-bubble";
import type { Route } from "./+types/message-page";
import { browserClient, makeSSRClient, type Database } from "~/supa-client";
import {
  getLoggedInUserId,
  getMessagesByRoomId,
  getRoomsParticipant,
  sendMessageToRoom,
} from "../queries";
import { useEffect, useRef, useState } from "react";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Message | wemake" }];
};

//message를 특정 parameter(messageId)에서 가져옴
/* #10.5 loader 는 원하면 중지할 수 있다. route의 revalidate(재검증) 여부와 시점을 선택할 수 있다
기본적으로 route는 다음과 같은 경우에 revalidate 된다.
1. form submit 발생했을 때
2. fetcher가 get data, post data 등의 동작을 했을 때
*/
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = await makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const messages = await getMessagesByRoomId(client, {
    /* #10.3 userId를 전달해 줘야 한다. 우리는 messages를 찾고 있는데, user가 해당 Room에 속한다는 걸 확실히 해야해서 그럼 
    user가 room에 속하지 않은 경우에는 해당 message를 볼 수 없게 해야함
    */
    messageRoomId: params.messageRoomId,
    userId,
  });
  const participants = await getRoomsParticipant(client, {
    messageRoomId: params.messageRoomId,
    userId,
  });
  return { messages, participants };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { client } = await makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  //zod로 검증해야하지만 일단 패스
  const message = formData.get("message");
  await sendMessageToRoom(client, {
    messageRoomId: params.messageRoomId,
    message: message as string,
    userId,
  });
  return {
    ok: true,
  };
};

export default function MessagePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [messages, setMessages] = useState(loaderData.messages);
  /* #10.3 root에서 로그인하면 전달해주는 outlet context값을 가져옴 
  하지만 아래 내용을 하면 에러가 발생할텐데, 이유는 message page는 message 레이아웃의 outlet 내부에서 render 된다.
  따라서 userId를 MessagesLayout으로부터 가져와야 한다.*/
  const { userId, name, avatar } = useOutletContext<{
    userId: string;
    name: string;
    avatar: string;
  }>();
  //form 제출한다음에 input 값 초기화 관련 처리
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (actionData?.ok) {
      formRef.current?.reset();
    }
  }, [actionData]);
  //useEffect는 browser에서 실행된다.
  useEffect(() => {
    /* #10.5 Realtime Messages
      browserClient는 자동으로 cookie를 살펴보고 그 cookie들을 supabase 로 전송한다. 여기서 우리가 하려고 하는건 
      database 자체의 event를 subscribe(구독) 하는 거다. 이게 바로 우리가 useEffect가 필요한 이유
      우리의 server, back-end, loader function들은 중간에 있을 수 없음(websocket connection을 생성할 수 없음)
      우리가 이 website를 서버리스 환경에 deploy 했기 때문이다.
      여기서는 우리가 website를 deploy 한 provider가 function을 생성한다. 만약에 우리가 loader나 action을 실행해야 하는 때에는 서버를 꺼버림
      loader에서는 realtime websocket connect을 생성하고 유지할 수 있을 만큼 공간이 없다.
      이게 바로 우리가 browser client를 사용하는 이유
      */
    const changes = browserClient
      .channel(
        //tiny security 이지만, 나중에 database 를 자체적으로 secure 하는 방법에 대해 알아볼거다.
        `room:${userId}-${loaderData.participants?.profile?.profile_id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // #10.5 아래처럼 해도 에러가 발생하는데 우리는 sender를 join 하고 있어서 에러가 발생한다.
          // 여기서는 join 할 수 없어서 우리가 해야할 일은 join을 여기서 사용하지 않는 거다.
          // 다시 말하지만 우리는 real-time 감지 중에는 join을 가져올 수 없다.
          setMessages((prev) => [
            ...prev,
            payload.new as Database["public"]["Tables"]["messages"]["Row"],
          ]);
        }
      )
      .subscribe();
    //component가 unmount 되면 unsubscribe
    return () => {
      changes.unsubscribe();
    };
  }, []);
  return (
    //#10.5 코드 챌린지 : 메시지가 추가되면 스크롤이 아래로 넘어가게 끔 해야함(reference 사용)
    <div className="h-full flex flex-col justify-between">
      {/* 헤더 */}
      <Card>
        <CardHeader className="flex flex-row gap-4 items-center">
          <Avatar className="size-14">
            <AvatarImage src={loaderData.participants.profile.avatar ?? ""} />
            <AvatarFallback>
              {loaderData.participants.profile.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            {/* 실시간으로 유저의 온라인 여부를 표시해보는 챌린지 추후 진행 */}
            <CardTitle>{loaderData.participants.profile.name}</CardTitle>
            <CardDescription>2 Days Ago</CardDescription>
          </div>
        </CardHeader>
      </Card>
      {/* 채팅내용. 현재 스크롤 안되어서 볼 수 없기 때문에 overflow-y-scroll 추가 */}
      {/* 메시지가 하나일때는 우측 상단에 위치해야 하므로 flex flex-col justify-start h-full 추가 */}
      <div className="py-10 overflow-y-scroll flex flex-col justify-start h-full space-y-4">
        {/* {Array.from({ length: 10 }).map((_, index) => (
          <MessageBubble
            key={index}
            content="Hello! How are you? I'm fine, thank you! How about you? I'm fine, thank you! How about you? I'm fine, thank you! How about you? I'm fine, thank you! How about you? I'm fine, thank you! How about you?"
            avatarUrl="https://github.com/shadcn.png"
            avatarFallback="CN"
            // 짝수번째 메시지는 isCurrentUser 값을 true로 넣어줌
            isCurrentUser={index % 2 === 0}
          />
        ))} */}
        {messages.map((message) => (
          /* #10.5 이 message가 senderID 즉 우리의 id를 가지고 있다면 우리 avatar를 보여줄 거다. 그렇지 않으면 users avatar를 보여줌 
          participant는 우리가 대화하고 있는 사람이다.
          */
          <MessageBubble
            key={message.message_id}
            content={message.content}
            avatarUrl={
              message.sender_id === userId
                ? avatar
                : loaderData.participants.profile.avatar ?? ""
            }
            avatarFallback={
              message.sender_id === userId
                ? name[0]
                : loaderData.participants.profile.name[0]
            }
            //current logged in user를 root로부터 전달하기 때문에
            isCurrentUser={message.sender_id === userId}
          />
        ))}
      </div>
      {/* 채팅입력 */}
      <Card>
        <CardHeader>
          {/* flex는 absolute인 요소의 위치도 조정할 수 있다 */}
          <Form
            ref={formRef}
            method="post"
            className="relative flex justify-end items-center"
          >
            <Textarea
              placeholder="Write a message..."
              rows={2}
              className="resize-none"
              name="message"
              required
            />
            <Button type="submit" size="icon" className="absolute right-2">
              <SendIcon className="size-4" />
            </Button>
          </Form>
        </CardHeader>
      </Card>
    </div>
  );
}

/* #10.5 browser에게 현재 route가 revalidate 되어야 하는지 알려주는 일을 한다(기본적으로는 return true) 
이 function은 route가 revalidate 되기 전에 호출될 거다(loader가 다시 호출되기 전)
revalidation은 loader function 이 호출되면서 진행되는 거다.
기본적으로 form을 submit 하면, 언제나 route를 revalidate 하고 싶어 한다.
false 의미 : form을 post하더라도 page revalidation을 하지 않겠다는 의미
*/
export const shouldRevalidate = (args: ShouldRevalidateFunctionArgs) => {
  return false;
};
