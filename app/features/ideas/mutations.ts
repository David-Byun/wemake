import * as pkg from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

export const claimIdea = async (
  client: pkg.SupabaseClient<Database>,
  { ideaId, userId }: { ideaId: string; userId: string }
) => {
  const { error } = await client
    .from("gpt_ideas")
    .update({
      claimed_by: userId,
      //   이 형식이 데이터베이스가 날짜를 저장하는 형식(#8.5)
      claimed_at: new Date().toISOString(),
    })
    .eq("gpt_idea_id", Number(ideaId))
    .select()
    .single();
  if (error) throw error;
};

export const insertIdeas = async (
  client: pkg.SupabaseClient<Database>,
  //개별아이디어를 하나씩 삽입하는 대신 한번에 모든 아이디어를 삽입할 수 있다.
  ideas: string[]
) => {
  const { error } = await client.from("gpt_ideas").insert(
    ideas.map((idea) => ({
      idea,
    }))
  );
  if (error) throw error;
};
