import type { Database } from "~/supa-client";
import pkg from "@supabase/supabase-js";

export const createPost = async (
  client: pkg.SupabaseClient<Database>,
  {
    title,
    content,
    category,
    userId,
  }: { title: string; content: string; category: string; userId: string }
) => {
  const { data: categoryData, error: categoryError } = await client
    .from("topics")
    .select("topic_id")
    .eq("slug", category)
    .single();
  if (categoryError) throw categoryError;
  /* 기본적으로 무언가를 생성할 때 생성된 데이터의 결과를 자동으로 반환하지 않기 때문에 data null이 나옴 
  아래에서 const {error} 로 해도됨. 하지만 우리는 생성된 포스트의 주소로 보내려면 생성된 data를 알아야 함(#8.0)
  */
  const { data, error } = await client
    .from("posts")
    .insert({
      title,
      content,
      //topic_id는 우리가 loader에서 받는 값
      topic_id: categoryData.topic_id,
      profile_id: userId,
    })
    //데이터 가져오기 위해 .select() 추가
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const createReply = async (
  client: pkg.SupabaseClient<Database>,
  {
    postId,
    reply,
    userId,
    topLevelId,
  }: { postId: string; reply: string; userId: string; topLevelId?: number }
) => {
  /* id를 가져와서 redirect 할 필요가 없어서 데이터를 가져올 필요 없음 
  Remix(React Router 7)의 마법 같은 기능 : form이 제출되고 action이 호출되면 자동으로 페이지의 loader가 다시 실행됨
  */
  const { error } = await client
    .from("post_replies")
    .insert({
      // 동적으로 객체를 구성하는 방법(#8.4) parent_id 또는 post_id 중 하나만 될 수 있고 동시에 될 수 없다.
      ...(topLevelId ? { parent_id: topLevelId } : { post_id: Number(postId) }),
      reply,
      profile_id: userId,
    })
    .select()
    .single();
  if (error) throw error;
};

/* #9.3 Optimistic UI : 기본적으로 사용자를 속이는 optimistic UI를 만들 수 있다.
기본적으로 mutation의 결과를 반영하는 것. backend에서 mutation이 완료되기 전에도!
"무엇을 추천하거나 누구를 팔로우하거나 답글을 작성할 때 여러분은 그냥 그 결과를 즉시 사용자에게 보여줄 수 있음"
mutation이 완료될때 까지 대기해야 하는 부분이 있긴 하지만 upvotes 같은 경우는 상관 없음
 */
export const toggleUpvote = async (
  client: pkg.SupabaseClient<Database>,
  { postId, userId }: { postId: string; userId: string }
) => {
  // toogle upvote
  const { count } = await client
    .from("post_upvotes")
    // head를 true로 하면 데이터 없이 count만 전달받고 싶다는 뜻
    .select("*", { count: "exact", head: true })
    .eq("post_id", Number(postId))
    .eq("profile_id", userId);
  if (count === 0) {
    await client
      .from("post_upvotes")
      .insert({ post_id: Number(postId), profile_id: userId });
  } else {
    await client
      .from("post_upvotes")
      .delete()
      .eq("post_id", Number(postId))
      .eq("profile_id", userId);
  }
};
