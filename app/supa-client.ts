//import { createClient } from "@supabase/supabase-js";
import {
  createBrowserClient,
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import type { Database as SupabaseDatabase } from "database.types";
import type { MergeDeep, SetNonNullable, SetFieldType } from "type-fest";

/* #5.5 Type Fest 추가 
우리가 할 것은 기본적으로 우리의 view가 정의된 곳의 경로를 따라가는 거다
다만, avatar가 null일 수 있으므로 이를 처리해줘야 한다
이것을 고치기 위해서 type fest로부터 SetFieldType 이라는 새로운 type을 사용한다.
type안에 있는 type의 field를 수정할 수 있게 해준다.
*/
// 우리 뷰에 있는 오버라이드가 있는 MergeDeep
export type Database = MergeDeep<
  SupabaseDatabase,
  {
    public: {
      Views: {
        //null 안되게 설정 #10.2
        messages_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["messages_view"]["Row"]
          >;
        };
        community_post_list_view: {
          Row: SetFieldType<
            SetNonNullable<
              SupabaseDatabase["public"]["Views"]["community_post_list_view"]["Row"]
            >,
            "author_avatar",
            string | null
          >;
        };
        //#6.3
        gpt_ideas_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["gpt_ideas_view"]["Row"]
          >;
        };
        //#6.8
        product_overview_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["product_overview_view"]["Row"]
          >;
        };
        //#6.10
        community_post_detail: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["community_post_detail"]["Row"]
          >;
        };
      };
    };
  }
>;

/* 
#5.10 clientLoader를 사용하려면 env값들을 직접 값으로 변경해줘야함 
*/
/*
#7.1 client에서 user를 알 수 있는 해답은 쿠키에 있음. 이 클라이언트는 자동으로 특정 쿠키를 찾고 쿠키를 사용해서 supabase와 통신해서 
누가 우리 애플리케이션을 사용하고 있는지 알아냄. 클라이언트가 응답을 받는다면 그게 바로 우리가 getUser 같은 함수를 사용할때임
정말 중요한건 이건 모두 클라이언트가 브라우저에서 실행될 때만 일어난다는 것이다(브라우저 안에서)
하지만 우리는 지금 서버 사이드 렌더링을 사용하고 있기 때문에 우리가 직접 브라우저로부터 쿠키를 가져와서 클라이언트에게 전달해줘야함

Browser
Client Cookies ---> Supabase Server ---> Who is the user?

Server
Browser Send Cookies ---> loader() receives cookies ---> Supabase SSC (cookies) ---> Supabase Server ---> Who is the user?
Browser Send Cookies ---> loader() receives cookies 부분은 자동으로 일어나고 쿠키를 받아서 Supabase SSC에 전달해줘야함

우리가 알아야할 또 다른 사항은 supabase 서버 사이드 클라이언트에게 유저의 쿠키를 주는 것 뿐만 아니라 사용자의 쿠키를 수정할 수 있는 권한도 부여해줘야함
(supabase 클라이언트가 쿠키를 설정하고 싶어 한다면)

https://supabase.com/docs/guides/auth/server-side/creating-a-client

supabase 클라이언트로부터 쿠키를 포워딩 하는 것임
*/
//#7.2 DM 이런데서 필요할 수 있으니 createBrowserClient를 사용해서 클라이언트를 만들어줘야함
/* #10.5 database 보안처리까지 해준다면 이건 이대로 publish 해도 괜찮음. 보안처리 안하면 이 Key가 모든 것에 접근할 수 있게 되고, 
우리는 5분 안에 해킹당함
*/
export const browserClient = createBrowserClient<Database>(
  "https://fcpvrfbncierupmdpoij.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcHZyZmJuY2llcnVwbWRwb2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NTk3ODgsImV4cCI6MjA1NTQzNTc4OH0.Kn6KE1iJiuy5Wm2gELD7sAOE3uspIMvMOgNmJMmjYeg"
);

//이 함수는 유저의 요청을 받아서 쿼리를 추출한 다음에 서버 사이드 클라이언트에게 전달해 줄거다.
export const makeSSRClient = (request: Request) => {
  const headers = new Headers();
  const serverSideClient = createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    /*두개의 메서드를 만들어야 하는데, 첫번째 메서드는 요청으로부터 특정 supbase 쿠키를 가져오는 기능이다.
    쿠키 설정도 해줄건데, 만약 유저를 로그인시켰다면 유저의 쿠키를 설정해준다. 
    getAll : supabase에게 유저의 쿠키를 줘야함 setAll : supabase가 쿠키를 설정할 수 있도록 해줌
    */
    {
      cookies: {
        getAll() {
          //쿠키 헤더를 받아서 supabase와 관련된 쿠키를 찾아낸다. 함수가 하는 일은 쿠키의 이름과 값을 디코딩하는거다.
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        //우리가 할일은 여기서 받은 쿠키들을 유저에게 전달할 응답에 붙여주기만 하면 된다. cookiesToSet은 supabase가 필요한 쿠키들의 배열
        setAll(cookiesToSet) {
          //supabase가 브라우저에 설정하고 싶어하는 쿠키들을 받아서 Set-Cookie 헤더 안에 넣은
          // 다음에 그러고 나선 헤더를 유저에게 돌려주면서 쿠키가 브라우저에 설정될 수 있도록 함
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append(
              "Set-Cookie",
              // 이 함수를 사용해서 Supabase가 보낸 쿠키를 브라우저에서 사용할 수 있는 쿠키로 변환
              serializeCookieHeader(name, value, options)
            );
          });
        },
      },
    }
  );
  //유저에게 줘서 브라우저에 쿠키를 설정하게 해야함(이제 계정 생성, 로그인, 로그아웃 등의 일을 하기 위해서 쿠키를 설정해줘야함)
  return { client: serverSideClient, headers };
};

//#11.1
// export const adminClient = createClient<Database>(
//   process.env.SUPABASE_URL_KEY!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );
