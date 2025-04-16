import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

/* Cursor는 열려있는 파일들로부터만 context를 받아와서, 열어놓고 해야 함
해당 파일에서는 navigaion.tsx 파일을 열어놓고 해야 함 

composer : 
create all the files for the routes in the file
하면 자동으로 파일이 생성됨
*/

export default [
  //우리 웹사이트의 첫번째 페이지
  index("common/pages/home-page.tsx"),
  ...prefix("/products", [
    // prefix 함수 안에 있는 index는 /products를 의미
    index("features/products/pages/products-page.tsx"),
    // pagination 로직을 모든 페이지에 넣는게 안좋으니 별도 레이아웃으로 만듦(#6.1)
    layout("features/products/layouts/leaderboard-layout.tsx", [
      ...prefix("leaderboards", [
        // 연별, 월별, 일별 리더보드
        index("features/products/pages/leaderboards-page.tsx"),
        route(
          "/yearly/:year",
          "features/products/pages/yearly-leaderboards-page.tsx"
        ),
        route(
          "/monthly/:year/:month",
          "features/products/pages/monthly-leaderboards-page.tsx"
        ),
        route(
          "/daily/:year/:month/:day",
          "features/products/pages/daily-leaderboards-page.tsx"
        ),
        route(
          "/weekly/:year/:week",
          "features/products/pages/weekly-leaderboards-page.tsx"
        ),
        route(
          "/:period",
          "features/products/pages/leaderboards-redirection-page.tsx"
        ),
      ]),
    ]),
    ...prefix("categories", [
      index("features/products/pages/categories-page.tsx"),
      route("/:category", "features/products/pages/category-page.tsx"),
    ]),
    route("/teams", "features/products/pages/teams-page.tsx"),
    route("/search", "features/products/pages/search-page.tsx"),
    route("/submit", "features/products/pages/submit-product-page.tsx"),
    route("/promote", "features/products/pages/promote-page.tsx"),
    //#13.3 추가
    route(
      "/promote/success",
      "features/products/pages/promote-success-page.tsx"
    ),
    /* 
      /:productId , /:productId/overview, /:productId/reviews, /:productId/reviews/new 식으로 반복되기에 prefix를 사용
      prefix("/:productId") ~ route("/new,~") 까지 선택해서 command + i  눌러줌
      루트 파일을 만들고 이미 존재하는 파일은 수정하지말아줘. 새로운 파일만 만들어줘 
    */
    ...prefix("/:productId", [
      /* 
      layout route 사용하기 위해서 layout 루트 생성, layout : 일종의 구멍이 있는 페이지로 생각
      구멍이라고 표현한 이유는 그 구멍에 children이 삽입되어 render 되기 때문
      URL 은 변경없이 하단 내용을 교체하는 방식
      */
      index("features/products/pages/product-redirect-page.tsx"),
      layout("features/products/layouts/product-overview-layout.tsx", [
        // children
        route("/overview", "features/products/pages/product-overview-page.tsx"),
        ...prefix("/reviews", [
          index("features/products/pages/product-reviews-page.tsx"),
          /*
            shadcn이 제공하는 Dialog 라는 아주 멋진 Component 존재
          */
        ]),
      ]),
      // #6.14
      route("/visit", "features/products/pages/product-visit-page.tsx"),
    ]),
  ]),
  //create these two pages
  ...prefix("/ideas", [
    index("features/ideas/pages/ideas-page.tsx"),
    route("/:ideaId", "features/ideas/pages/idea-page.tsx"),
    //#11.1 api라우트 형태로 하는게 보기 좋음(페이지가 아닌 경우). GET 요청을 통해 생성 작업을 트리거(trigger)할 수 있도록 설정
    //cron job으로 변환할 때 POST 요청으로 변경
    route("/generate", "features/ideas/pages/generate-idea-page.tsx"),
  ]),
  //create these files, do not attempt to prefill any loader function or action function
  ...prefix("/jobs", [
    index("features/jobs/pages/jobs-page.tsx"),
    route("/:jobId", "features/jobs/pages/job-page.tsx"),
    route("/submit", "features/jobs/pages/submit-job-page.tsx"),
  ]),
  //auth를 유저안에 넣어도 되지만, auth 자체가 분리된 거라 분리되는 거를 선호함
  ...prefix("/auth", [
    layout("features/auth/layouts/auth-layout.tsx", [
      route("/login", "features/auth/pages/login-page.tsx"),
      route("/join", "features/auth/pages/join-page.tsx"),
      // 메일 또는 휴대폰으로 인증번호 보냄
      ...prefix("/otp", [
        route("/start", "features/auth/pages/otp-start-page.tsx"),
        route("/complete", "features/auth/pages/otp-complete-page.tsx"),
      ]),
      //사용자 인증과 관련해서 다시 한번 상기시켜주고 싶은 것은 /start 페이지로 가면 인증과정이 시작된다. 인증마치고 나면 complete 페이지에서 사용자를 받음(#7.7)
      ...prefix("/social/:provider", [
        route("/start", "features/auth/pages/social-start-page.tsx"),
        route("/complete", "features/auth/pages/social-complete-page.tsx"),
      ]),
    ]),
    route("/logout", "features/auth/pages/logout-page.tsx"),
  ]),
  //create these files, do not attempt to prefill any loader function or action function and main function must have 'default'
  ...prefix("/community", [
    index("features/community/pages/community-page.tsx"),
    route("/:postId", "features/community/pages/post-page.tsx"),
    //렌더링되지 않는 페이지 (UI가 만들어지지 않는 페이지): #9.1 fetcher Forms
    route("/:postId/upvote", "features/community/pages/upvote-post-page.tsx"),
    route("/submit", "features/community/pages/submit-post-page.tsx"),
  ]),
  //create these files, do not attempt to prefill any loader function or action function and main function must have 'default'
  ...prefix("/teams", [
    index("features/teams/pages/teams-page.tsx"),
    route("/:teamId", "features/teams/pages/team-page.tsx"),
    route("/create", "features/teams/pages/submit-team-page.tsx"),
  ]),
  //dashboard랑 messages는 sidebar 필요한데, shadcn에서 제공하는 sidebar 사용
  ...prefix("/my", [
    layout("features/users/layouts/dashboard-layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/pages/dashboard-page.tsx"),
        route("/ideas", "features/users/pages/dashboard-ideas-page.tsx"),
        // 사용자가 특정 제품에 대한 통계 정보를 볼 수 있음
        route(
          "/products/:productId",
          "features/users/pages/dashboard-product-page.tsx"
        ),
      ]),
    ]),
    /* 본인 접근 페이지이며, 사용자가 들어오면 쿠키를 읽을 거다. 세션을 추출한 다음 /users/:username 으로 리다이렉트 할 것이다.
     */
    route("/profile", "features/users/pages/my-profile-page.tsx"),
    route("/settings", "features/users/pages/settings-page.tsx"),
    route("/notifications", "features/users/pages/notifications-page.tsx"),
    route(
      // #9.6 이전의 upvote와 마찬가지로 이건 action 만을 위한 route. 이건 어떤 UI도 가지지 않기에 어떤 사람들은 이런 Routes를 API Routes라 부른다.
      "/notifications/:notificationId/see",
      "features/users/pages/see-notification-page.tsx"
    ),
    // /messages 페이지에 레이아웃을 추가하려 한다. 레이아웃에 사이드바를 넣어서 항상 보이게 만듦. 사용자가 사이드바 클릭하면 /:messageId로 이동해서 메시지 확인
    layout("features/users/layouts/messages-layout.tsx", [
      ...prefix("/messages", [
        index("features/users/pages/messages-page.tsx"),
        route("/:messageRoomId", "features/users/pages/message-page.tsx"),
      ]),
    ]),
  ]),
  //공개된 페이지
  ...prefix("/users/:username", [
    layout("features/users/layouts/profile-layout.tsx", [
      index("features/users/pages/profile-page.tsx"),
      //해당 유저가 판매중인 모든 제품들을 볼 수 있다
      route("/products", "features/users/pages/profile-products-page.tsx"),
      route("/posts", "features/users/pages/profile-posts-page.tsx"),
    ]),
    //message를 post 해준다(message를 생성하기 위해). action 등은 /api/ 형태로 해도 되지만 여기선 페이지 형태로 한다.
    route("/messages", "features/users/pages/send-messages-page.tsx"),
    //코드 실행시켜서 resend를 사용해 이메일을 보내기 위한 트리거 역할(#12.3)
    //헤더를 사용해 보호. 만약 이 라우트를 크론 잡에서 호출한다면 헤더를 사용할 수 있는데, 그렇게 하면 Supabase의 크론 잡외에 다른 누군가가
    //이 라우트를 호출하는 것을 막을 수 있다. ** 라우트 보호하는건 중요함
    route("/welcome", "features/users/pages/welcome-page.tsx"),
  ]),
] satisfies RouteConfig;
