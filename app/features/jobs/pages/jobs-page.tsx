import { PageHeader } from "~/common/components/page-header";
import { JobCard } from "../components/job-card";
import type { Route } from "./+types/jobs-page";
import { Button } from "~/common/components/ui/button";
import { JOB_TYPE, LOCATION_TYPE, SALARY_TYPE } from "../constants";
import { data, useSearchParams } from "react-router";
import { cn } from "~/lib/utils";
import { getJobs } from "../queries";
import { z } from "zod";
import { makeSSRClient } from "~/supa-client";
export const meta = () => {
  return [
    { title: "Jobs" },
    { name: "description", content: "Browse all job listings" },
  ];
};

/* #6.4 과제
URL을 이용해서 type이 선택되었는지 확인하고 filter를 해제하는 버튼을 만들면 좋음
*/

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  if (!success) {
    throw data(
      {
        error_code: "invalid_search_params",
        message: "Invalid search params",
      },
      {
        status: 400,
      }
    );
  }
  const { client } = makeSSRClient(request);
  const jobs = await getJobs(client, {
    limit: 40,
    location: parsedData.location,
    type: parsedData.type,
    salary: parsedData.salary,
  });
  return { jobs, ...parsedData };
};

const searchParamsSchema = z.object({
  type: z
    .enum(JOB_TYPE.map((type) => type.value) as [string, ...string[]])
    .optional(),
  location: z
    .enum(LOCATION_TYPE.map((type) => type.value) as [string, ...string[]])
    .optional(),
  salary: z.enum(SALARY_TYPE).optional(),
});

export default function JobsPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const onFilterClick = (key: string, value: string) => {
    searchParams.set(key, value);
    setSearchParams(searchParams);
  };
  return (
    <div className="space-y-20">
      <PageHeader title="Jobs" subtitle="Browse all job listings" />
      <div className="grid grid-cols-1 gap-20 items-start xl:grid-cols-6">
        {/* 아래 부분이 6개 중에 4개의 column을 차지하기 원함  : col-span-4 
        md : 중간크기와 그 이상의 화면에 적용됨
        */}
        <div className="grid grid-cols-1 gap-5 col-span-4 md:grid-cols-2 lg:grid-cols-3 xl:col-span-4">
          {loaderData.jobs.map((job) => (
            <JobCard
              id={job.job_id}
              title={job.position}
              company={job.company_name}
              companyLogoUrl={job.company_logo}
              createdAt={job.created_at}
              type={job.job_type}
              workType={job.location}
              companyHp={job.company_location}
              positionLocation={job.company_location}
              salary={job.salary_range}
              key={job.job_id}
            />
          ))}
        </div>
        {/* 나머지 2개 영역 차지 : sticky 속성 - 사이드바 고정시키기 위해 사용 */}
        <div className="sticky top-20 xl:col-span-2 space-y-10">
          <div className="flex flex-col gap-2.5 items-start">
            <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
            {/* flex-wrap : 너비가 넓어지면 아래로 내려감 */}
            <div className="flex flex-wrap gap-2">
              {JOB_TYPE.map((type) => {
                return (
                  <Button
                    variant={"outline"}
                    key={type.value}
                    onClick={() => onFilterClick("type", type.value)}
                    className={cn(
                      searchParams.get("type") === type.value ? "bg-accent" : ""
                    )}
                  >
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 items-start">
            <h4 className="text-sm font-medium text-muted-foreground">
              Location
            </h4>
            {/* flex-wrap : 너비가 넓어지면 아래로 내려감 */}
            <div className="flex flex-wrap gap-2">
              {LOCATION_TYPE.map((type) => {
                return (
                  <Button
                    variant={"outline"}
                    key={type.value}
                    onClick={() => onFilterClick("location", type.value)}
                    className={cn(
                      searchParams.get("location") === type.value
                        ? "bg-accent"
                        : ""
                    )}
                  >
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 items-start">
            <h4 className="text-sm font-medium text-muted-foreground">
              Salary Range
            </h4>
            {/* flex-wrap : 너비가 넓어지면 아래로 내려감 */}
            <div className="flex flex-wrap gap-2">
              {SALARY_TYPE.map((type) => {
                return (
                  <Button
                    variant={"outline"}
                    key={type}
                    onClick={() => onFilterClick("salary", type)}
                    className={cn(
                      searchParams.get("salary") === type ? "bg-accent" : ""
                    )}
                  >
                    {type}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
