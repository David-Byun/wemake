import { jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const eventType = pgEnum("event_type", [
  "product_view",
  "product_visit",
  "profile_view",
]);

/* 테이블 만들고 npm run db:generate 하고 npm run db:migrate 하고 나서 테이블 만들기 
https://supabase.com/docs/reference/javascript/rpc
RPCs : supabase를 이용하면서 백엔드가 없는 경우 더욱 유용함. sql function 개념이며, 로직이 거의 변하지 않는 경우에 유용함
*/
export const events = pgTable("events", {
  event_id: uuid("event_id").primaryKey().defaultRandom(),
  event_type: eventType("event_type"),
  event_data: jsonb("event_data"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
