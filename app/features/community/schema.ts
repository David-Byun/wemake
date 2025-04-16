import {
  bigint,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { profiles } from "../users/schema";

export const topics = pgTable("topics", {
  topic_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  topic: text().notNull(),
  //url encoding된 형태가 아니고 ai-auto 이런 식의 문자열로 url로 표출되게끔 하기 위해(slug는 name 의 URL 친화적인 버전)
  slug: text().notNull(),
  created_at: timestamp().notNull().defaultNow(),
});

export const follows = pgTable("follows", {
  follower_id: uuid().references(() => profiles.profile_id, {
    onDelete: "cascade",
  }),
  following_id: uuid().references(() => profiles.profile_id, {
    onDelete: "cascade",
  }),
  created_at: timestamp().notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  post_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  title: text().notNull(),
  content: text().notNull(),
  upvotes: bigint({ mode: "number" }).default(0),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
  //posts는 topic_id에 참조
  topic_id: bigint({ mode: "number" })
    .references(() => topics.topic_id, {
      onDelete: "cascade",
    })
    .notNull(),
  profile_id: uuid()
    .references(() => profiles.profile_id, {
      onDelete: "cascade",
    })
    .notNull(),
});

export const postUpvotes = pgTable(
  "post_upvotes",
  {
    post_id: bigint({ mode: "number" }).references(() => posts.post_id, {
      onDelete: "cascade",
    }),
    profile_id: uuid().references(() => profiles.profile_id, {
      onDelete: "cascade",
    }),
  },
  //자동완성이 쉬워지기 때문에 이미 완료된 파일을 열어두는게 이래서 유용함
  (table) => [primaryKey({ columns: [table.post_id, table.profile_id] })]
);

/* 
  #6.11 post_replies는 자기 참조를 하고 있다. parent_id는 post_replies 테이블의 post_reply_id를 다시 참조
*/
export const postReplies = pgTable("post_replies", {
  post_reply_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  // 댓글을 다는 대상
  post_id: bigint({ mode: "number" }).references(() => posts.post_id, {
    onDelete: "cascade",
  }),
  /* 대댓글도 있기 때문에 상위 댓글(patent id)도 저장. 기본적으로 댓글이 다른 댓글을 상위 댓글로 참조할 수 있음 
      parent_id 가 null 이면 최상위 댓글이고, 
      parent_id 가 있으면 그 댓글의 대댓글이다.
      https://orm.drizzle.team/docs/indexes-constraints#foreign-key

      
      self reference 만들려고 하고 있고 에러나는건 Typescript 제한 때문이다. 그래서 아래 처럼 써줌
      (): AnyPgColumn => postReplies.post_reply_id,
  */
  //post_id, parent_id는 둘중 하나만 될 수 있고 동시에 될 수 없다.
  parent_id: bigint({ mode: "number" }).references(
    //이 column은 같은 테이블의 다른 column을 참조하고 있다.
    (): AnyPgColumn => postReplies.post_reply_id,
    {
      onDelete: "cascade",
    }
  ),
  //댓글을 다는 유저
  profile_id: uuid()
    .references(() => profiles.profile_id, {
      onDelete: "cascade",
    })
    .notNull(),
  reply: text().notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

// npm run db:generate 하고 생성될 SQL 코드를 항상 검토하는 게 필요
