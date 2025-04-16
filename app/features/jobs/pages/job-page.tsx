import { Badge } from "~/common/components/ui/badge";
import type { Route } from "./+types/job-page";
import { DotIcon } from "lucide-react";
import { Button } from "~/common/components/ui/button";
import { getJobById } from "../queries";
import { DateTime } from "luxon";
import { makeSSRClient } from "~/supa-client";

//loader에서 데이터를 받으므로 렌더링
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: ` title : ${data.job.position}| wemake` },
    { name: "description", content: "View job details" },
  ];
};

//validation은 직접 해볼 것
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const job = await getJobById(client, { jobId: Number(params.jobId) });
  return { job };
};

export default function JobPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <div className="bg-gradient-to-tr from-primary/80 to-primary/10 h-60"></div>
      {/* 6컬럼의 빅 컨테이너 */}
      <div className="grid grid-cols-6 gap-20 items-start -mt-20 ">
        <div className="col-span-4 space-y-10">
          <div className="size-40 bg-white rounded-full overflow-hidden relative left-10">
            <img
              src={loaderData.job.company_logo}
              alt="company logo"
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{loaderData.job.position}</h1>
            <h4 className="text-lg text-muted-foreground">
              {loaderData.job.company_name}
            </h4>
          </div>
          <div className="flex gap-2 capitalize">
            <Badge variant={"secondary"}>{loaderData.job.job_type}</Badge>
            <Badge variant={"secondary"}>{loaderData.job.location}</Badge>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">Overview</h4>
            <p className="text-lg">{loaderData.job.overview}</p>
          </div>
          <div className="space-y-2.5">
            {/* 직무를 작성하면 직무는 아마 쉼표로 구분된 여러가지의 항목이 될거다. 그리고 그것을 list로 렌더링 (데이터도 값이 쉼표로 구분되어있게끔 해서 DB 저장 */}
            <h4 className="text-2xl font-bold">Responsibilities</h4>
            <ul className="text-lg list-disc list-inside">
              {loaderData.job.responsibilities.split(",").map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">Qualifications</h4>
            <ul className="text-lg list-disc list-inside">
              {loaderData.job.qualifications.split(",").map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">Benefits</h4>
            <ul className="text-lg list-disc list-inside">
              {loaderData.job.benefits.split(",").map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5">
            <h4 className="text-2xl font-bold">Skills</h4>
            <ul className="text-lg list-disc list-inside">
              {loaderData.job.skills.split(",").map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-span-2 sticky border rounded-lg mt-32 top-20 p-6 space-y-5">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Avg. Salary</span>
            <span className="text-2xl font-medium">
              {loaderData.job.salary_range}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Location</span>
            <span className="text-2xl font-medium">
              {loaderData.job.company_location}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-2xl font-medium">
              {loaderData.job.job_type}
            </span>
          </div>
          <div className="flex ">
            <span className="text-sm text-muted-foreground">
              Posted {DateTime.fromISO(loaderData.job.created_at).toRelative()}
            </span>
            <DotIcon className="size-4" />
            <span className="text-sm text-muted-foreground">395 views</span>
          </div>
          <Button className="w-full">Apply Now</Button>
        </div>
      </div>
    </div>
  );
}
