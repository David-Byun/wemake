import type { Database } from "~/supa-client";
import pkg from "@supabase/supabase-js";
import type { z } from "zod";
import type { formSchema } from "./pages/submit-job-page";

/* z.infer : zod 에서 사용하는 건데, 우리가 중복 작업을 하지 않도록 해줌. schema를 만들었으면 이걸 function의 argument type으로 재사용 가능
해당 formSchema export 해야함 (#8.1)
*/
export const createJob = async (
  client: pkg.SupabaseClient<Database>,
  data: z.infer<typeof formSchema>
) => {
  //데이터베이스에서는 snake case를 사용해야 함
  const { data: jobData, error } = await client
    .from("jobs")
    .insert({
      position: data.position,
      overview: data.overview,
      responsibilities: data.responsibilities,
      qualifications: data.qualifications,
      benefits: data.benefits,
      skills: data.skills,
      company_name: data.companyName,
      company_location: data.companyLocation,
      company_logo: data.companyLogoUrl,
      apply_url: data.applyUrl,
      //enum인데 string으로 인식해서 오류 발생 따라서 as 붙여줌
      job_type: data.jobType as "full-time" | "part-time" | "remote",
      location: data.location as "remote" | "in-person" | "hybrid",
      salary_range: data.salary,
    })
    .single();
  if (error) throw error;
  return jobData;
};
