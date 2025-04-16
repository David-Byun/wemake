/* 
    Users 테이블은 Supabase의 인증기능을 위해 특별히 만들어짐
    따라서 users 테이블이 아니고 profile 테이블로 만들어야 함
    Supabase 가 만드는 Users 테이블은 건드는게 아니고
    Profile 테이블에는 Users 테이블에 들어있지 않은 정보를 저장함
*/

import {
  bigint,
  boolean,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "../products/schema";
import { posts } from "../community/schema";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";

/*
    이 테이블은 실제로 Supabase에 보내지지 않지만, Typescript가 제대로 작동하도록 하기 위해 필요함
    이건 Drizzle ORM 때문에 하는거임. 나중에 Drizzle이 이 코드를 supabase에 push하려고 시도함
    그리고 Supabase가 "auth schema에 users 테이블을 만들 필요 없어"라고 말할거다 > 이미 존재하기 때문에
    이걸 하는 유일한 이유는 우리 profiles 테이블의 profile_id column이 users 테이블의 id를 참조하기 때문이다.
    > Drizzle 이 알도록. 그래야 profiles 테이블을 foreign key로 연결할 수 있음
    이미 존재하고 보호되어 있으니 이 테이블은 만들어지는 건 아님

    테이블과 enum 모두 export 해야함
    단, users 테이블은 이미 존재하기 때문에 테이블 생성이 필요 없어서 export 하지 않음
*/
//#14.1 drizzle authUser로 수정
// const users = pgSchema("auth").table("users", {
//   id: uuid().primaryKey(),
// });

export const roles = pgEnum("role", [
  "developer",
  "designer",
  "marketer",
  "founder",
  "product-manager",
]);

export const profiles = pgTable("profiles", {
  /* 
    profiles 테이블의 id를 users 테이블의 ID에 대한 foreign key로 만드는 것이다. 
    references 는 foreign key 관계를 만드는 방식
    */
  profile_id: uuid()
    .primaryKey()
    // onDelete cascade 이유 : 유저가 자신의 계정을 삭제하면 프로필도 삭제되어야 함
    .references(() => authUsers.id, { onDelete: "cascade" }),
  avatar: text(),
  name: text().notNull(),
  username: text().notNull(),
  headline: text(),
  bio: text(),
  role: roles().default("developer").notNull(),

  /* jsonb 로 하는 이유는 이 profiles에 JSON 데이터를 저장하려고 함 
  팔로워와 팔로잉 카운터를 역정규화 하고 싶기 때문이다. 이 column으로 유저를 팔로우하는 사람들을 추적할 것이다.
  */
  stats: jsonb()
    .$type<{
      followers: number;
      following: number;
    }>()
    .default({
      followers: 0,
      following: 0,
    }),
  views: jsonb(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

/* many to many relation . 이건 모두 foreign key 관계여서 follower id나 following id가 이 프로필이 삭제될 때 어떻게 처리될지 지정해야함 */
export const followers = pgTable("followers", {
  follower_id: uuid()
    .references(() => profiles.profile_id, {
      onDelete: "cascade",
    })
    .notNull(),
  following_id: uuid()
    .references(() => profiles.profile_id, {
      onDelete: "cascade",
    })
    .notNull(),
  created_at: timestamp().notNull().defaultNow(),
});
//다 하고 1) npm run db:generate 2) npm run db:migrate

export const notificationTypes = pgEnum("notification_type", [
  "follow",
  "review",
  "reply",
  // 대댓글
  "mention",
]);

/* 
  notification은 여러 가지 타입이 있을 수 있다. 예를 들어 누군가 다른 사람을 팔로우 할때 notification이 생기고, 
  누군가 다른 사람의 포스트에 좋아요를 누를 때 notification이 생기고, 누군가 다른 사람의 포스트에 댓글을 달 때 notification이 생길 수 있다.
  두가지 대상이 있기 때문에 그걸 target이랑 source라고 부를 것이다.
  source는 그 행동을 수행해서 notification을 생성하는 사람이다.
*/
export const notifications = pgTable("notifications", {
  notification_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  /* 이 사람은 액션을 행하는 사람(예를 들어 다른 사람을 팔로우 하는 사람이며 이 사람이 notification을 생성함) 
  source_id가 notification을 만들 수 있는데, target_id(타겟유저)의 상품을 리뷰했을때도 만든다.
  source_id가 상품을 리뷰했으면 어떤 상품을 리뷰했는지도 알아야함. 그래서 product_id 를 추가
  source_id, product_id는 null이어도 되지만, target_id는 null이면 안됨
  */
  source_id: uuid().references(() => profiles.profile_id, {
    onDelete: "cascade",
  }),
  product_id: bigint({ mode: "number" }).references(() => products.product_id, {
    onDelete: "cascade",
  }),
  /* 이 사람은 액션을 받는 사람(알림이 보여짐) 타겟id가 notNull인 이유는 notification을 생성할 때 source 없이 특정 유저만을 위하기 때문이다 
  예를 들어 전체 공지같은..! 타겟 id는 notification을 받을 사람이다.
  */
  target_id: uuid()
    .references(() => profiles.profile_id, {
      onDelete: "cascade",
    })
    .notNull(),
  post_id: bigint({ mode: "number" }).references(() => posts.post_id, {
    onDelete: "cascade",
  }),
  type: notificationTypes().notNull(),
  seen: boolean().default(false).notNull(),
  created_at: timestamp().notNull().defaultNow(),
});

/* #10.1 여러 유저가 메시지룸에 있을 수 있기 때문에 many to many relation 라서 연결 테이블이 필요함 
messageRooms에는 user에 관한 정보를 갖고 있지 않다.
이 schema는 3명 이상의 user가 있는 message room을 고려해서 만들었기 때문
*/
export const messageRooms = pgTable("message_rooms", {
  message_room_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  created_at: timestamp().notNull().defaultNow(),
});

/* #10.1 message room에 입장하려면, message_room_members row를 생성해줘야함. 
 profile_id가 fromUserId와 일치하는 곳에서 멤버를 찾아줘야함
 profile_id가 toUserId와 일치하는 곳에서 멤버를 찾아줘야함. 그리고 그것들이 동일한 message_room_id를 가지고 있어야함
  */
export const messageRoomMembers = pgTable(
  "message_room_members",
  {
    message_room_id: bigint({ mode: "number" })
      .references(() => messageRooms.message_room_id, {
        onDelete: "cascade",
      })
      .notNull(),
    //message room의 멤버가 누구인지 추적해야 한다.
    profile_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
    created_at: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.message_room_id, table.profile_id] }),
  })
);

export const messages = pgTable("messages", {
  message_id: bigint({ mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  //특정 message_room으로 전달됨. message_room_id가 없으면 message를 생성할 수 없다.
  message_room_id: bigint({ mode: "number" })
    .references(() => messageRooms.message_room_id, { onDelete: "cascade" })
    .notNull(),
  //누가 보냈는지. sender_id가 없으면 message를 생성할 수 없다.
  sender_id: uuid()
    .references(() => profiles.profile_id, {
      onDelete: "cascade",
    })
    .notNull(),
  content: text().notNull(),
  /* 이건 두사람만 있는 message room에서만 작동함. 만약 다수의 유저가 있는 message rooms를 구현한다면 작동하지 않음 
  seen: boolean().notNull().default(false),*/

  /* 카카오톡 처럼 읽었으면 숫자 줄어드는 방식 : 누군가 메시지를 보내면 seen_by 기본값은 0이 됨
  그래서 누군가 메시지를 보내면 방에 몇명이 있는지 숫자로 표시할 수 있음. 그리고 방에 있는 사람 수에서 seen_by 숫자를 빼면 안읽은 사람 수가 나옴
  seen_by: integer().notNull().default(0),
  */
  created_at: timestamp().notNull().defaultNow(),
});

//#14.1 Drizzle RLS 정책 정하는 연습
//테이블 만들고 npm run db:generate
export const todos = pgTable(
  "todos",
  {
    todo_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    title: text().notNull(),
    completed: boolean().notNull().default(false),
    created_at: timestamp().notNull().defaultNow(),
    profile_id: uuid()
      .references(() => profiles.profile_id, {
        onDelete: "cascade",
      })
      .notNull(),
  },
  (table) => [
    //#14.1 supabase 어드민에서 설정하는게 아니라 코드로 설정하는 방법
    //npm run db:generate > npm run db:migrate
    //테이블을 만들면서 동시에 보안 설정도 할 수 있는데, 이보다 쉬울수 없다(누가 읽을 수 있고, 누가 삽입할 수 있는지등)
    pgPolicy("todos-insert-policy", {
      //사용자가 Insert 할 수 있도록 허용하는 정책
      for: "insert",
      //authenticatedRole 사용자만 insert 할 수 있음
      to: authenticatedRole,
      as: "permissive",
      /* #14.1 기억해둬! 무언가를 insert 할 때는 insert 되는 대상을 확인할 수 있다.
      만약 데이터가 우리가 설정한 조건과 일치하지 않으면, 데이터가 삽입되지 않도록 하는 것 그래서 withCheck 사용
      auth.uid()를 사용하면 현재 요청을 보낸 사용자의 UID를 가져올 수 있음 
      https://orm.drizzle.team/docs/rls#using-with-supabase 
      아래 의미 : 새로운 todo 항목을 insert 할 때 todo의 profile_id 컬럼을 보고 그 항목의 값이 authUid와 일치하는지 확인하는 것*/
      withCheck: sql`${authUid} = ${table.profile_id}`,
    }),
    pgPolicy("todos-select-policy", {
      for: "select",
      //참고로 authenticatedRole만 실행한 policy를 만들면 익명 사용자(anonymous role)는 기본적으로 아무 권한도 가지지 않게 됨
      to: authenticatedRole,
      as: "permissive",
      //withCheck는 데이터가 삽입될 때 유효성을 검사하는 역할을 하고, using은 해당 사용자가 특정 작업을 수행할 권한이 있는지 확인할 때 사용
      using: sql`${authUid} = ${table.profile_id}`,
    }),
  ]
);
