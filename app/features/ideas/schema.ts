import {
  bigint,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "../users/schema";

export const gptIdeas = pgTable("gpt_ideas", {
  gpt_idea_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  idea: text("idea").notNull(),
  views: integer().notNull().default(0),
  //채택(claim)된 날짜와 누가 채택했는지 저장. nullable로 둔 이유는 null이라면 idea가 채택되지 않음을 의미
  claimed_at: timestamp(),
  //profile 삭제되면 채택된 idea도 삭제
  claimed_by: uuid().references(() => profiles.profile_id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* 좋아요 기능 : composite primary key 설정 
https://orm.drizzle.team/docs/indexes-constraints#foreign-key*/
export const gptIdeasLikes = pgTable(
  "gpt_ideas_likes",
  {
    gpt_idea_id: bigint({ mode: "number" }).references(
      () => gptIdeas.gpt_idea_id,
      { onDelete: "cascade" }
    ),
    profile_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
  },
  (table) => [primaryKey({ columns: [table.gpt_idea_id, table.profile_id] })]
);
