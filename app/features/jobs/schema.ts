/* schema.ts 만들고 1. npm run db:generate 2. npm run db:migrate */

import { bigint, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { JOB_TYPE, LOCATION_TYPE, SALARY_TYPE } from "./constants";

export const jobTypes = pgEnum(
  "job_type",
  /*
  [string, ...string[]]는 다음을 의미합니다:
  최소 1개 이상의 문자열을 포함하는 배열
  첫 번째 요소는 반드시 string이어야 함
  ...string[]는 나머지 요소들도 모두 string이어야 함을 의미
  */
  JOB_TYPE.map((type) => type.value) as [string, ...string[]]
);

export const locations = pgEnum(
  "location",
  LOCATION_TYPE.map((type) => type.value) as [string, ...string[]]
);

// string list 형식이라서 key:value 형태가 아님
export const salaryRanges = pgEnum("salary_range", SALARY_TYPE);

export const jobs = pgTable("jobs", {
  //mode : number 로 하면 bigint > number 로 변환. javascript의 camel case 표기법 사용 X. SQL에서는 snake case 표기법 사용
  job_id: bigint("job_id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  position: text().notNull(),
  overview: text().notNull(),
  qualifications: text().notNull(),
  responsibilities: text().notNull(),
  benefits: text().notNull(),
  skills: text().notNull(),
  company_name: text().notNull(),
  company_logo: text().notNull(),
  company_location: text().notNull(),
  apply_url: text().notNull(),
  job_type: jobTypes().notNull(),
  location: locations().notNull(),
  salary_range: salaryRanges().notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});
