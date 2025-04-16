/* migrations 파일들은 drizzle config에서 지정한 폴더에 저장되어 있음
meta라는 폴더도 하나 있는데 이건 단순히 적용했던 migration들을 쌓는 폴더다.
1) jobs schema 파일을 열어보는 걸 추천한다. 그러면 cursor가 테이블 구조가 어떤지 알 수 있음
 */

import {
  bigint,
  boolean,
  check,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "../users/schema";
import { sql } from "drizzle-orm";

//product 페이지 및 상세 & 다양한 정보들 있는 내용 적어줌
export const products = pgTable(
  "products",
  {
    product_id: bigint("product_id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    name: text().notNull(),
    /* #13.4 cron job을 생성해서 이 프로모션들을 주기적으로 확인. 결제를 확인하고 결제 기록을 저장하는 것 뿐만 아니라 프로모션에 대한 기록도 만들어야 함
    매분 가장 최근에 추가된 프로모션을 확인하고 그 데이터의 promotionFrom과 promotionTo를 확인해서 
    어떤 제품이 지금 프로모션을 시작해야 하거나, 이미 시작됐어야 하는 상태라면 그 제품의 is_promoted값을 true로 변경한다.
    이렇게 하면 제품을 검색하거나 리더보드를 조회할 때 is_promoted가 true 인 것부터 정렬할 수 있다.
    cron job을 만들건데 그 cron job은 현재 날짜를 가져와서 지금 진행중인 프로모션이 있는지 확인하고 진행중인 프로모션이 있다면 해당 제품을 찾아서
    is_promoted를 true로 설정할거다. 그리고 모든 프로모션된 product를 살펴보면서 promotionTo를 보고 프로모션이 끝났는지 확인.
    프로모션이 끝났다면, is_promoted를 false로 바꿈
    */
    is_promoted: boolean().notNull().default(false),
    tagline: text().notNull(),
    description: text().notNull(),
    how_it_works: text().notNull(),
    icon: text().notNull(),
    url: text().notNull(),
    /* stats를 초기화할 때 기본값(default) 설정 1. upvotes count 해주던가, trigger 사용해서 json 관련 항목 +1 하는 방법
     upvotes : 0 default 값 설정해준 다음에 npm db:generate하고 npm db:migrate 해줘야 함(#6.0)
  */
    stats: jsonb().notNull().default({ views: 0, reviews: 0, upvotes: 0 }),
    // 상품을 만든 사람을 알아야 하므로 profile_id 참조. profiles 테이블의 profile_id가 이 타입. 프로필이 삭제되면 제품도 삭제 된다.
    // profile_id: uuid().references(() => profiles.profile_id, {
    //   onDelete: "cascade",
    // }),
    /* #6.12 profile_id foreign key 이름을 직접 지정하고 싶은 경우에는 아래처럼 하고 별도 제약조건으로 걸어야함 */
    profile_id: uuid().notNull(),
    // category를 삭제한다고 해도 category에 속한 제품도 같이 삭제되지 않도록 set null 설정
    category_id: bigint({ mode: "number" }).references(
      () => categories.category_id,
      { onDelete: "set null" }
    ),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  },
  // #6.12 references 가 더 쉬운 방법이지만 아래 처럼 활용할 수 있음(컬럼등 다양하게). 그 다음에 npm run db:generate, npm run db:migrate
  (table) => [
    foreignKey({
      columns: [table.profile_id],
      foreignColumns: [profiles.profile_id],
      name: "products_to_profiles",
    }).onDelete("cascade"),
  ]
);

export const categories = pgTable("categories", {
  category_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  name: text().notNull(),
  description: text().notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

/* 이 테이블은 composite primary key를 가짐 
composite primary key란 테이블을 만들 때 primary key가 여러 column으로 구성된 걸 말한다.
primary key는 고유해야함
*/
export const product_upvotes = pgTable(
  "product_upvotes",
  {
    //유저가 upvote를 누른 제품의 ID와 유저의 ID를 조합해서 primary key를 만든다. 제품이 삭제되면 upvote도 삭제된다.
    product_id: bigint({ mode: "number" }).references(
      () => products.product_id,
      {
        onDelete: "cascade",
      }
    ),
    //profiles 테이블의 profile_id column의 data type이 uuid. 프로필이 삭제되면 해당 upvote도 삭제
    profile_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
  }, // 테이블에 constraints를 전달할 수 있는 function을 만들 수 있음(table : 현재 테이블 의미)
  (table) => [primaryKey({ columns: [table.product_id, table.profile_id] })]
);

export const reviews = pgTable(
  "reviews",
  {
    review_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    //제품이 삭제되면 리뷰도 삭제
    product_id: bigint({ mode: "number" })
      .references(() => products.product_id, {
        onDelete: "cascade",
      })
      .notNull(),
    profile_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    rating: integer().notNull(),
    review: text().notNull(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
  },
  //sql 함수를 사용하면 원시 sql 쿼리를 작성할 수 있음. 중요한건 반드시 백틱(`)을 사용해야함. rating column의 값이 1과 5 사이여야 함
  (table) => [check("rating_check", sql`${table.rating} BETWEEN 1 AND 5`)]
);
// 다 하고 1) npm run db:generate 2) npm run db:migrate
