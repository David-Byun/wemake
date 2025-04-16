import pkg from "@supabase/supabase-js";
import { type Database } from "~/supa-client";

export const getTeams = async (
  client: pkg.SupabaseClient<Database>,
  { limit }: { limit: number }
) => {
  /* 팀이름이 바뀌었으니 업데이트된 database에 맞는 type을 생성하기 위해 npm run db:typegen 
  data에 type 팀리더가 null이 안되기 위해 !inner 추가
  */
  const { data, error } = await client
    .from("teams")
    .select(
      `
      team_id,
      roles,
      product_description,
      team_leader:profiles!inner(
        username,
        avatar
      )
      `
    )
    .limit(limit);
  if (error) throw error;
  return data;
};

export const getTeamById = async (
  client: pkg.SupabaseClient<Database>,
  teamId: number
) => {
  const { data, error } = await client
    .from("teams")
    .select(
      `
      *,
      team_leader:profiles!inner(
        username,
        avatar,
        role,
        username
      )
      `
    )
    .eq("team_id", teamId)
    .single();
  if (error) throw error;
  return data;
};
