// import { SupabaseClient } from "@supabase/supabase-js";
import pkg from "@supabase/supabase-js";
import type { Database } from "~/supa-client";

export const getJobs = async (
  client: pkg.SupabaseClient<Database>,
  {
    limit,
    location,
    type,
    salary,
  }: {
    limit: number;
    location?: string;
    type?: string;
    salary?: string;
  }
) => {
  const baseQuery = client
    .from("jobs")
    .select(
      `
    job_id,
    position,
    overview,
    company_name,
    company_logo,
    company_location,
    job_type,
    location,
    salary_range,
    created_at,
    updated_at
    `
    )
    .limit(limit);
  /* #6.4 Jobs Pages typescript 오류 질의 필ㅛ
  if (location) {
    baseQuery.eq("location", location);
  }
  if (type) {
    baseQuery.eq("job_type", type);
  }
  if (salary) {
    baseQuery.eq("salary_range", salary);
  }
  */
  const { data, error } = await baseQuery;
  if (error) throw error;
  return data;
};

export const getJobById = async (
  client: pkg.SupabaseClient<Database>,
  { jobId }: { jobId: number }
) => {
  const { data, error } = await client
    .from("jobs")
    .select("*")
    .eq("job_id", jobId)
    .single();
  if (error) throw error;
  return data;
};
