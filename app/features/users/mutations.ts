import type { Database } from "~/supa-client";
import pkg from "@supabase/supabase-js";

export const updateUser = async (
  client: pkg.SupabaseClient<Database>,
  {
    id,
    name,
    role,
    headline,
    bio,
  }: {
    id: string;
    name: string;
    role: "developer" | "designer" | "marketer" | "founder" | "product-manager";
    headline: string;
    bio: string;
  }
) => {
  // 말했듯이 여러분이 username 같이 추가로 수정하고 싶은 데이터가 있다면, 여기서 그 username을 사용하는 프로필이 이미 존재하지 않은지 확인 필요
  const { error } = await client
    .from("profiles")
    .update({
      name,
      role,
      headline,
      bio,
    })
    .eq("profile_id", id);
};

export const updateUserAvatar = async (
  client: pkg.SupabaseClient<Database>,
  {
    id,
    avatarUrl,
  }: {
    id: string;
    avatarUrl: string;
  }
) => {
  // 말했듯이 여러분이 username 같이 추가로 수정하고 싶은 데이터가 있다면, 여기서 그 username을 사용하는 프로필이 이미 존재하지 않은지 확인 필요
  const { error } = await client
    .from("profiles")
    .update({
      avatar: avatarUrl,
    })
    .eq("profile_id", id);
};

export const seeNotification = async (
  client: pkg.SupabaseClient<Database>,
  { userId, notificationId }: { userId: string; notificationId: number }
) => {
  const { error } = await client
    .from("notifications")
    .update({ seen: true })
    .eq("notification_id", notificationId)
    /* #9.6 이렇게 하는 이유는 알다시피 notification이 특정 user를 대상으로 하기 때문이다. 그 notification의 target이 되었을 때만 볼 수 있게 해주고 싶다.
    항상 누군가가 인증되지 않은 방식으로 네 action을 호출하려는 경우를 생각해보아야 함
     */
    .eq("target_id", userId);
  if (error) {
    throw error;
  }
};

export const sendMessage = async (
  client: pkg.SupabaseClient<Database>,
  {
    fromUserId,
    toUserId,
    content,
  }: { fromUserId: string; toUserId: string; content: string }
) => {
  /* function을 만들어줘야 한다. function을 우리의 RPC를 활용해 호출할건데, 이 function은 message room을 찾아낸다. 
  message를 해당 message room에 전송하기 위해 만약 message room이 있다면 우리는 id를 가져온다. 
  */
  const { data, error } = await client
    .rpc("get_room", {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      /* #10.1 single() 사용도 원하지 않는다. 이건 row가 없을 경우 error를 throw 하기 때문이다. maybeSingle() 사용 : 존재 또는 null 
    이건 기본적으로 0 개 또는 1 개의 row를 반환한다.
    */
    })
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data?.message_room_id) {
    //#10.1 message room이 존재한다면 그 말은, 우리가 message를 생성하고 그 room에 넣어줘야 한다는 뜻. 그 user는 이미 그 room에 들어가 있으니까
    await client.from("messages").insert({
      message_room_id: data.message_room_id,
      sender_id: fromUserId,
      content,
    });
    return data.message_room_id;
  } else {
    //#10.1 message room이 존재하지 않는다면, 우리는 새로운 message room을 생성해야 한다.
    const { data: roomData, error: roomDataError } = await client
      .from("message_rooms")
      .insert({})
      //생성되는 room id를 가져오고 싶다.
      .select("message_room_id")
      .single();
    if (roomDataError) {
      throw roomDataError;
    }
    //두개의 message room member를 생성해야 한다.
    /*
    await client.from("message_room_members").insert({
      message_room_id: newRoom.message_room_id,
      profile_id: fromUserId,
    });
    await client.from("message_room_members").insert({
      message_room_id: newRoom.message_room_id,
      profile_id: toUserId,
    });
    */
    //  위처럼 두개가 아니라 한개의 request로 처리할 수도 있음
    await client.from("message_room_members").insert([
      {
        message_room_id: roomData.message_room_id,
        profile_id: fromUserId,
      },
      {
        message_room_id: roomData.message_room_id,
        profile_id: toUserId,
      },
    ]);
    await client.from("messages").insert({
      message_room_id: roomData.message_room_id,
      sender_id: fromUserId,
      content,
    });
    return roomData.message_room_id;
  }
};
