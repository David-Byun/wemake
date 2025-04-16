import { makeSSRClient } from "~/supa-client";
import type { Route } from "./+types/send-messages-page";
import { getLoggedInUserId, getUserProfile } from "../queries";
import { redirect } from "react-router";
import { sendMessage } from "../mutations";

//우리가 message를 보낼 user의 username이 들어있음(params)
export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const { client } = makeSSRClient(request);
  const fromUserId = await getLoggedInUserId(client);
  //message를 수신하는 user의 userId를 가져와야 함
  const { profile_id: toUserId } = await getUserProfile(client, {
    username: params.username,
  });
  const formData = await request.formData();
  //모든 process가 진행된 다음에는 user를 새로 생성된 room으로 redirect 시켜주고 싶다.
  //function은 한가지 일만 수행하는게 좋은데 아래 함수는 메시지 룸도 생성하고, 메시지도 생성하기 때문에 두개의 일을 수행하는 함수가 됨 >> 수정하면 좋음
  //room을 생성하거나 찾아내서 message를 삽입해줌
  const messageRoomId = await sendMessage(client, {
    fromUserId,
    toUserId,
    content: formData.get("content") as string,
  });
  return redirect(`/my/messages/${messageRoomId}`);
};
