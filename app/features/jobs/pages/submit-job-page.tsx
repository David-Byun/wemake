import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/submit-job-page";
import { Form, redirect } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import SelectPair from "~/common/components/select-pair";
import { JOB_TYPE, LOCATION_TYPE, SALARY_TYPE } from "../constants";
import { Button } from "~/common/components/ui/button";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";
import { z } from "zod";
import { createJob } from "../mutations";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Post a Job | wemake" },
    { name: "description", content: "Post a new job listing" },
  ];
};

export const formSchema = z.object({
  position: z.string().min(1).max(40),
  overview: z.string().min(1).max(400),
  responsibilities: z.string().min(1).max(400),
  qualifications: z.string().min(1).max(400),
  benefits: z.string().min(1).max(400),
  skills: z.string().min(1).max(40),
  companyName: z.string().min(1).max(40),
  companyLogoUrl: z.string().min(1).max(400),
  companyLocation: z.string().min(1).max(40),
  applyUrl: z.string().min(1).max(40),
  jobType: z.enum(JOB_TYPE.map((type) => type.value) as [string, ...string[]]),
  location: z.enum(
    LOCATION_TYPE.map((location) => location.value) as [string, ...string[]]
  ),
  salary: z.enum(SALARY_TYPE),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  await getLoggedInUserId(client);
};

/* job 을 특정 사용자랑 연결하는게 좋을 수 있다. foreign key 로 연결해서 관리자 패널에서 특정 사용자가 생성한 "jobs"을 보여줄수도 있고,
schema를 수정해서 jobs와 users 간의 관계를 만들어봐. 사용자가 본인이 올린 jobs을 수정할수 있도록 하거나 사람을 구했을때는
그 job을 닫을 수 있게도 할 수 있다 >> 코드챌린지 (#8.1)
*/
export const action = async ({ request }: Route.ActionArgs) => {
  //client를 가져와서 사용자가 로그인했는지 확인
  const { client } = makeSSRClient(request);
  await getLoggedInUserId(client);
  const formData = await request.formData();
  const { success, data, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return {
      fieldErrors: error.flatten().fieldErrors,
    };
  }
  const { job_id } = await createJob(client, { ...data });
  return redirect(`/jobs/${job_id}`);
};

//actionData 에서 오류 발생시 화면에 표시
export default function SubmitJobPage({ actionData }: Route.ComponentProps) {
  return (
    <div>
      <PageHeader
        title="Post a Job"
        subtitle="Reach out to the best developers in the world"
      />

      <Form
        method="post"
        className="max-w-screen-2xl flex flex-col mx-auto items-center space-y-10 w-full"
      >
        <div className="grid grid-cols-3 gap-10 w-full">
          <InputPair
            label="Position"
            description="(40 characters max)"
            name="position"
            maxLength={40}
            type="text"
            required
            id="position"
            defaultValue="e.g. Software Engineer"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.position?.join(", ")}
            </div>
          )}
          <InputPair
            label="Overview"
            description="(400 characters max)"
            name="overview"
            maxLength={400}
            type="text"
            required
            defaultValue="e.g. We are looking for a software engineer with a passion for building scalable and efficient systems."
            textArea
            id="overview"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.overview?.join(", ")}
            </div>
          )}
          <InputPair
            label="Responsibilities"
            description="(400 characters max, comma separated)"
            name="responsibilities"
            maxLength={400}
            type="text"
            required
            defaultValue="e.g. Design and implement scalable and efficient systems."
            textArea
            id="responsibilities"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.responsibilities?.join(", ")}
            </div>
          )}
          <InputPair
            label="Qualifications"
            description="(400 characters max, comma separated)"
            name="qualifications"
            maxLength={400}
            type="text"
            required
            defaultValue="e.g. Bachelor's degree in Computer Science or equivalent experience."
            textArea
            id="qualifications"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.qualifications?.join(", ")}
            </div>
          )}
          <InputPair
            label="Benefits"
            description="(400 characters max, comma separated)"
            name="benefits"
            maxLength={400}
            type="text"
            required
            defaultValue="e.g. Health insurance, 401(k) plan, etc."
            textArea
            id="benefits"
          />
          <InputPair
            label="Skills"
            description="(400 characters max, comma separated)"
            name="skills"
            maxLength={40}
            type="text"
            required
            defaultValue="e.g. React, TypeScript, Node.js, etc."
            id="skills"
          />
          <InputPair
            label="Company Name"
            description="(400 characters max, comma separated)"
            name="companyName"
            maxLength={40}
            type="text"
            required
            defaultValue="e.g. Apple, Google, etc."
            id="companyName"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.companyName?.join(", ")}
            </div>
          )}
          <InputPair
            label="Company Logo URL"
            description="(400 characters max, comma separated)"
            name="companyLogoUrl"
            type="url"
            required
            defaultValue="e.g. https://example.com/logo.png"
            id="companyLogoUrl"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.companyLogoUrl?.join(", ")}
            </div>
          )}
          <InputPair
            label="Company Location"
            description="(40 characters max, comma separated)"
            name="companyLocation"
            type="text"
            required
            defaultValue="e.g. San Francisco, CA"
            id="companyLocation"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.companyLocation?.join(", ")}
            </div>
          )}
          <InputPair
            label="Apply URL"
            description="(40 characters max)"
            name="applyUrl"
            type="url"
            required
            defaultValue="https://example.com/apply"
            id="applyUrl"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.applyUrl?.join(", ")}
            </div>
          )}
          <SelectPair
            label="Job Type"
            description="Select the type of job"
            name="jobType"
            required
            placeholder="Select Job Type"
            options={JOB_TYPE.map((type) => ({
              label: type.label,
              value: type.value,
            }))}
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.jobType?.join(", ")}
            </div>
          )}
          <SelectPair
            label="Location"
            description="Select the location of the job"
            name="location"
            required
            placeholder="Select Location"
            options={LOCATION_TYPE.map((location) => ({
              label: location.label,
              value: location.value,
            }))}
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.location?.join(", ")}
            </div>
          )}
          <SelectPair
            label="Salary"
            description="Select the salary of the job"
            name="salary"
            required
            placeholder="Select Salary"
            options={SALARY_TYPE.map((salary) => ({
              label: salary,
              value: salary,
            }))}
          />
        </div>
        <Button type="submit" className="w-full max-w-sm" size="lg">
          Post job for $100
        </Button>
      </Form>
    </div>
  );
}
