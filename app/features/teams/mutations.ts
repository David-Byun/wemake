import type { Database } from "~/supa-client";
import pkg from "@supabase/supabase-js";
import type { z } from "zod";
import type { formSchema } from "./pages/submit-team-page";

export const createTeam = async (
  client: pkg.SupabaseClient<Database>,
  userId: string,
  data: z.infer<typeof formSchema>
) => {
  const { data: teamData, error } = await client
    .from("teams")
    .insert({
      product_name: data.name,
      product_stage: data.stage as "idea" | "prototype" | "mvp" | "launched",
      team_size: data.size,
      equity_split: data.equity,
      roles: data.roles,
      product_description: data.description,
      team_leader_id: userId,
    })
    .select("team_id")
    .single();
  if (error) throw error;
  return teamData;
};
