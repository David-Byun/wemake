import { type Database } from "~/supa-client";
import pkg from "@supabase/supabase-js";

export const getGptIdeas = async (
  client: pkg.SupabaseClient<Database>,
  { limit }: { limit: number }
) => {
  /* 처음에 생성할때는 data가 아래 형태이므로, supa-client.ts에서 수정해줘야함 
    gpt_idea_id: number | null;
    idea: string | null;
    is_claimed: boolean | null;
    likes: number | null;
    views: number | null;
    */
  const { data, error } = await client
    .from("gpt_ideas_view")
    .select("*")
    .limit(limit);
  if (error) throw error;
  return data;
};

export const getGptIdea = async (
  client: pkg.SupabaseClient<Database>,
  { ideaId }: { ideaId: string }
) => {
  const { data, error } = await client
    .from("gpt_ideas_view")
    .select("*")
    /* #6.3 gpt_idea_id 컬럼이 URL로부터 받은 ideaId의 값과 같은지 확인 filtering 
        [] 형태로 return 하는데 딱 한개의 idea만 return 된다는걸 어떻게 확신할 수 있을까 ?
        그건 우리도 모르고, typescript도 알지 못함.
        id가 하나이기 때문에 하나의 결과만 나오므로 이를 typescript에게 single()로 알려줌
    */
    .eq("gpt_idea_id", parseInt(ideaId))
    .single();
  if (error) throw error;
  return data;
};

export const getClaimedIdeas = async (
  client: pkg.SupabaseClient<Database>,
  { userId }: { userId: string }
) => {
  const { data, error } = await client
    .from("gpt_ideas")
    .select("gpt_idea_id, claimed_at, idea")
    .eq("claimed_by", userId);
  if (error) throw error;
  return data;
};
