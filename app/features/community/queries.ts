/* 
https://supabase.com/docs/reference/javascript/installing 
npm install @supabase/supabase-js
*/

import pkg from "@supabase/supabase-js";
import { DateTime } from "luxon";
import { type Database } from "~/supa-client";

// view 불러오면 타입스크립트를 읽을수 없으므로 에러가 발생 > npm run db:typegen 실행
// supabase 자동완성 잘되게 조치 : https://supabase.com/docs/reference/javascript/typescript-support
// package.json에 추가함
export const getTopics = async (client: pkg.SupabaseClient<Database>) => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const { data, error } = await client.from("topics").select("topic, slug");
  // console.log(data, error);
  // data null 없애기 위해서
  if (error) throw new Error(error.message);
  return data;
};

/* supabase가 우리의 posts table에 topic_id라는 column이 있다는 것을 앎. 그래서 supabase가 그 topic_id column으로 그것들을 join 함
그냥 topics ( topic ),  이런식으로 적으면 left join을 하기 때문에 즉 오른쪽이 null일수 있어서 데이터가 있다고 보장되면 topics!inner ( topic ), 이렇게 해야함
이름 바꾸려면 topic : , author : 이렇게 해야함 as 기능
Supabase는 posts table의 post와 profiles table을 연결하려고 하고 있음
topic은 1:1 관계라 이슈가 없음
profiles 테이블과는 직접 연결되어 있고, post_upvotes 를 통해서 간접적으로 연결되어 있음
따라서 어떤 관계를 사용하려고 하는건지 써줌(foreign key 써줘야함)
author: profiles!posts_profile_id_profiles_profile_id_fk!inner (name, username, avatar)

export const getPosts = async () => {
  const { data, error } = await client.from("posts").select(`
    post_id, 
    title, 
    created_at, 
    topic: topics!inner ( topic ), 
    author: profiles!posts_profile_id_profiles_profile_id_fk!inner (name, username, avatar),
    upvotes: post_upvotes (count)
  `);
  console.log(data, error);
  if (error) throw new Error(error.message);
  return data;
};
*/

//pagination 처리 해줘야함
export const getPosts = async (
  client: pkg.SupabaseClient<Database>,
  {
    limit,
    sorting,
    period = "all",
    keyword,
    topics,
  }: {
    // period, keyword를 required 하지 않은 이유는 home-page에서 저 값들을 굳이 보낼 필요 없음
    limit: number;
    sorting: "newest" | "popular";
    period?: "all" | "today" | "week" | "month" | "year";
    keyword?: string;
    topics?: string;
  }
) => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  /* query를 생성한 뒤 바로 await를 실행하는 것이 아니라 조건에 따라 query에 filter를 추가 바로 await 하지 않음*/
  const baseQuery = client
    .from("community_post_list_view")
    .select("*")
    .limit(limit);
  if (sorting === "newest") {
    baseQuery.order("created_at", { ascending: false });
  } else if (sorting === "popular") {
    if (period === "all") {
      baseQuery.order("upvotes", { ascending: false });
    } else {
      const today = DateTime.now();
      if (period === "today") {
        baseQuery.gte("created_at", today.startOf("day").toISO());
      } else if (period === "week") {
        baseQuery.gte("created_at", today.startOf("week").toISO());
      } else if (period === "month") {
        baseQuery.gte("created_at", today.startOf("month").toISO());
      } else if (period === "year") {
        baseQuery.gte("created_at", today.startOf("year").toISO());
      }
      baseQuery.order("upvotes", { ascending: false });
    }
  }

  if (keyword) {
    //ilike가 SQL 취약점을 보호해줌
    baseQuery.ilike("title", `%${keyword}%`);
  }

  //#6.2 view 수정 > npm run db:typegen 실행 > 로직 추가
  if (topics) {
    baseQuery.eq("topics_slug", topics);
  }

  const { data, error } = await baseQuery;
  /*
  const { data, error } = await client
    .from("community_post_list_view")
    .select("*")
    .limit(limit);
  */
  //console.log(data, error);
  if (error) throw new Error(error.message);
  return data;
};

export const getPostById = async (
  client: pkg.SupabaseClient<Database>,
  { postId }: { postId: number }
) => {
  const { data, error } = await client
    .from("community_post_detail")
    .select("*")
    .eq("post_id", postId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getReplies = async (
  client: pkg.SupabaseClient<Database>,
  { postId }: { postId: number }
) => {
  const replyQuery = `
    post_reply_id,
    reply,
    created_at,
    user:profiles (
      name,
      avatar,
      username
      )
  `;
  // data에 마우스를 올려둠으로 쿼리 컬럼등이 틀렸는지도 확인할 수 있다.
  const { data, error } = await client
    .from("post_replies")
    /*  #6.11 이렇게 foreign key를 담고 있는 테이블의 이름을 넣는 것 만으로도 supabase는 해당 테이블을 찾아서 Join 한 다음 결과물을 보여준다. 
    단 한개의 댓글이 있고, 다른 사람들은 그 댓글에 답댓글을 달 수있다(무한 댓글 X, 멘션 이용)
    */
    .select(
      `
      ${replyQuery},
      post_replies (
        ${replyQuery}
      )
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  console.log(JSON.stringify(data, null, 2));
  if (error) throw new Error(error.message);
  return data;
};
