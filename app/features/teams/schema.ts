import {
  pgTable,
  bigint,
  text,
  timestamp,
  integer,
  pgEnum,
  check,
  uuid,
} from "drizzle-orm/pg-core";
import { PRODUCT_STAGE } from "./constants";
import { sql } from "drizzle-orm";
import { profiles } from "../users/schema";

/* enum 변수를 가지고 와서 db에서 사용하는 방법(export 해서 사용해야함) 
먼저 generate를 했다면 다시 수정해서 generate 하고 생성된 것을 기존 sql 파일에 잘라내기 붙여넣기 하고 다시 migrate 하면 됨
*/
export const productStage = pgEnum(
  "product_stage",
  //   배열이 최소 하나 이상의 문자열을 포함해야 함을 보장(첫번째는 string, 나머지도 모두 string)
  PRODUCT_STAGE.map((stage) => stage.value) as [string, ...string[]]
);

/* column 타입이나 function이 이름과 함께 호출되는데, text("role") 이렇게 하는건 예전 버전이고 최신버전 drizzle에서는 text() 하면 충분 */
export const team = pgTable(
  "teams",
  {
    team_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    product_name: text().notNull(),
    team_size: integer().notNull(),
    equity_split: integer().notNull(),
    roles: text().notNull(),
    product_description: text().notNull(),
    product_stage: productStage().notNull(),
    /* #6.5 팀리더가 누락되어서 추가하고 다시 npm run db:generate 하고 npm run db:migrate 
    notNull() 없이 만든다음에 팀리더를 Table Editor에서 추가하고 그 이후에 다시 notNull() 추가
    */
    team_leader_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  },
  //새로운 버전에서는 array로 해야함. 이전 버전에서는 object를 return 해야 했음
  (table) => [
    check("team_size_check", sql`${table.team_size} BETWEEN 1 AND 100`),
    check("equity_split_check", sql`${table.equity_split} BETWEEN 1 AND 100`),
    //between 1 and 100 은 숫자용이기 때문에 문자열인 경우에는 between 을 사용할 수 없음. 그래서 length를 사용
    check(
      "product_description_check",
      sql`LENGTH(${table.product_description}) <= 200`
    ),
  ]
);
