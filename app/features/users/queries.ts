import { type Database } from "~/supa-client";
import { productListSelect } from "../products/queries";
import pkg from "@supabase/supabase-js";
import { redirect } from "react-router";

export const getUserProfile = async (
  client: pkg.SupabaseClient<Database>,
  { username }: { username: string }
) => {
  const { data, error } = await client
    .from("profiles")
    .select(
      `
      profile_id,
      name,
      username,
      avatar,
      role,
      headline,
      bio
      `
    )
    .eq("username", username)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const getUserById = async (
  client: pkg.SupabaseClient<Database>,
  { id }: { id: string }
) => {
  const { data, error } = await client
    .from("profiles")
    .select(
      `
      profile_id,
      name,
      username,
      avatar,
      headline,
      bio,
      role
      `
    )
    .eq("profile_id", id)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

/* #6.12
    Cardinality : products와 profiles을 연결하려 하는데, supabase는 어떤 relationship으로 이 작업을 해야하는 건지 모름
    왜냐하면 products는 profile_id를 통해서 profiles 연결될 수 있고 product upvotes와 profile_id를 이용해도 profile과 연결될 수 있음
    'profiles!products_profile_id_profiles_profile_id_fk', 'profiles!product_upvotes' 중 선택

    foreign key 긴 이름 바꾸는 방법 > product schema #6.12 참고
*/
export const getUserProducts = async (
  client: pkg.SupabaseClient<Database>,
  { username }: { username: string }
) => {
  const { data, error } = await client
    .from("products")
    .select(
      `
      ${productListSelect}
      , profiles!products_to_profiles!inner (profile_id)`
    )
    /* #6.12 문제는 이 정보가 products 테이블에 저장되어 있지 않다는 점. product는 자신을 생성한 유저의 username에 대해선 알지 못함
     .eq("username", username);
     아래 쿼리가 작동하려면 테이블을 join 하거나 profiles.username을 여기 select에 포함시켜줘야 함. 
     , profiles!products_to_profiles!inner (profile_id)` 처럼 join 해야 아래 eq로 조건 추가할 수 있음
      */
    .eq("profiles.username", username);
  if (error) {
    throw error;
  }
  return data;
};

//#6.13 view에는 이미 author_username이 존재
export const getUserPosts = async (
  client: pkg.SupabaseClient<Database>,
  { username }: { username: string }
) => {
  const { data, error } = await client
    .from("community_post_list_view")
    .select("*")
    .eq("author_username", username);
  if (error) {
    throw error;
  }
  return data;
};

export const getLoggedInUserId = async (
  client: pkg.SupabaseClient<Database>
) => {
  const { data, error } = await client.auth.getUser();
  if (error || data.user === null) {
    throw redirect("/auth/login");
  }
  return data.user.id;
};

export const getProductsByUserId = async (
  client: pkg.SupabaseClient<Database>,
  { userId }: { userId: string }
) => {
  const { data, error } = await client
    .from("products")
    .select(`name, product_id`)
    .eq("profiles.profile_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data;
};

export const getNotifications = async (
  client: pkg.SupabaseClient<Database>,
  { userId }: { userId: string }
) => {
  const { data, error } = await client
    .from("notifications")
    // source_id는 foreign key로 profiles table에 대한 것
    // npm run db:typegen
    /* #9.5 notification은 특정한 product나 post에 대한 review로 생성*/
    .select(
      `
      notification_id,
      type,
      source:profiles!source_id(
        profile_id,
        name,
        avatar
      ),
      product:products!product_id(
        product_id,
        name
      ),
      post:posts!post_id(
        post_id,
        title
      ),
      seen,
      created_at
      `
    )
    .eq("target_id", userId);
  if (error) {
    throw error;
  }
  return data;
};

export const countNotifications = async (
  client: pkg.SupabaseClient<Database>,
  { userId }: { userId: string }
) => {
  const { count, error } = await client
    .from("notifications")
    // count 하기 위해서 head : true 사용
    .select("*", { count: "exact", head: true })
    // 아직 읽지 않은 알림 개수 카운트
    .eq("seen", false)
    .eq("target_id", userId);
  if (error) {
    throw error;
  }
  return count ?? 0;
};

//view만든걸로 쿼리 만들어서 조회 messages_view
export const getMessages = async (
  client: pkg.SupabaseClient<Database>,
  { userId }: { userId: string }
) => {
  const { data, error } = await client
    .from("messages_view")
    .select("*")
    .eq("profile_id", userId)
    .neq("other_profile_id", userId);
  if (error) {
    throw error;
  }
  return data;
};

export const getMessagesByRoomId = async (
  client: pkg.SupabaseClient<Database>,
  { messageRoomId, userId }: { messageRoomId: string; userId: string }
) => {
  //유저가 존재하는지 체크
  const { count, error: countError } = await client
    .from("message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("message_room_id", Number(messageRoomId))
    .eq("profile_id", userId);
  if (countError) {
    throw countError;
  }
  //user와 message_room_id를 갖는 message_room_members 가 없을 때
  if (count === 0) {
    throw new Error("Message room not found");
  }

  const { data, error } = await client
    .from("messages")
    //아바타를 갖고 오기 위해서 profiles 테이블과 join. null이 될수 없으니까 inner join을 사용할 수 있다.
    /*  sender:profiles!sender_id(
        name,
        avatar
      )*/
    .select(`*`)
    .eq("message_room_id", Number(messageRoomId))
    .order("created_at", { ascending: true });
  if (error) {
    throw error;
  }
  return data;
};

export const getRoomsParticipant = async (
  client: pkg.SupabaseClient<Database>,
  { messageRoomId, userId }: { messageRoomId: string; userId: string }
) => {
  //room의 참가자를 보려고 하는 user가 room에 속하는 것을 확실하게 해줄거다.
  //room의 참여자들을 보려고 하는 user가 그 room의 구성원인지 항상 확인해줘야함
  const { count, error: countError } = await client
    .from("message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("message_room_id", Number(messageRoomId))
    .eq("profile_id", userId);
  if (countError) {
    throw countError;
  }
  //user와 message_room_id를 갖는 message_room_members 가 없을 때
  if (count === 0) {
    throw new Error("Message room not found");
  }
  const { data, error } = await client
    .from("message_room_members")
    .select(
      `
      profile:profiles!profile_id!inner(
        profile_id,
        name,
        avatar
      )
      `
    )
    //우리가 기대하는 Room에 있어야 하고 기본적으로 나 자신이 아니어야함
    .eq("message_room_id", Number(messageRoomId))
    .neq("profile_id", userId)
    //스스로를 뺀 participant가 한명이므로 single(). 여러명의 participants로 구현하고 있다면 이를 수정해줘야함
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const sendMessageToRoom = async (
  client: pkg.SupabaseClient<Database>,
  {
    messageRoomId,
    message,
    userId,
  }: { messageRoomId: string; message: string; userId: string }
) => {
  const { count, error: countError } = await client
    .from("message_room_members")
    .select("*", { count: "exact", head: true })
    .eq("message_room_id", Number(messageRoomId))
    .eq("profile_id", userId);
  if (countError) {
    throw countError;
  }
  //user와 message_room_id를 갖는 message_room_members 가 없을 때
  if (count === 0) {
    throw new Error("Message room not found");
  }
  //user가 room에 message를 보낼 수 있게 허가되었는지 확인
  const { error } = await client.from("messages").insert({
    content: message,
    sender_id: userId,
    message_room_id: Number(messageRoomId),
  });
  if (error) {
    throw error;
  }
};
