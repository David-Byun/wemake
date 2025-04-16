import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Navigation } from "./common/components/navigation";
import { Settings } from "luxon";
import { cn } from "./lib/utils";
import { makeSSRClient } from "~/supa-client";
import { countNotifications, getUserById } from "./features/users/queries";

// #7.3 Action Function
// 인증에 있어서 가장 먼저 해야 할 것은 사용자가 로그인 했는지 안했는지다.
// 루트 파일에서 네비게이션 바를 렌더링할때 사용자가 로그인했는지 여부를 알아야 한다.

// #7.6 사용자를 받고 있다. 사용자 객체에는 ID가 있고 이 ID는 profiles 테이블에 있는 프로필의 ID와 동일하다.
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  //이 메서드는 유저의 속성을 담고 있는 객체 데이터를 return 한다.
  const {
    data: { user },
  } = await client.auth.getUser();
  //프로필 정보 보여주기 위한 코드(#7.6), notification 개수 카운트 위한 코드(#9.6)
  if (user && user.id) {
    const profile = await getUserById(client, { id: user.id });
    const count = await countNotifications(client, { userId: user.id });
    return { user, profile, notificationsCount: count };
  }
  return { user: null, profile: null, notificationsCount: 0 };
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  /* 
    Settings 는 luxon 의 전역 설정을 할 수 있는 함수. 한국 시간으로 설정 
    Layout은 UI에서만 동작하고 meta 태그에서는 동작하지 않는다.
  */
  Settings.defaultLocale = "ko";
  Settings.defaultZone = "Asia/Seoul";
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <main>{children}</main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

//사용자가 어디에 있는지 알려주는 hook을 사용할 거다(auth 레이아웃은 헤더등 다르게 가기 위해)
export default function App({ loaderData }: Route.ComponentProps) {
  //사용자가 auth의 어떤 페이지에 있어도 navigation bar를 숨김
  const { pathname } = useLocation();
  /* 
    navigation에서 일어나는 것에 대한 정보를 실제로 얻을 수 있음 
    navigation.state는 아무일도 일어나지 않고 사용자가 한 페이지에 있다는 idle일수 있고 사용자가 다른 페이지로 이동중이라는 loading일수 있음
    다른 페이지로 이동한다는 건 그 다른 페이지의 loader가 실행되는 것을 의미함(#5.7)
  */
  const navigation = useNavigation();
  /* 
    loading은 사용자가 link를 클릭했을 때 발생함. React router가 대상이 되는 페이지를 rendering 하는것 
    React router는 그 대상의 페이지의 loader가 완료되기를 기다리고 있다.(#5.7)
  */
  const isLoading = navigation.state === "loading";
  // loaderData.user가 null이 아니라면 로그인된 상태로 가정(#7.3)
  const isLoggedIn = loaderData.user !== null;
  return (
    <div
      className={cn({
        "py-28 px-5 lg:px-20": !pathname.includes("/auth/"),
        "transition-opacity animate-pulse": isLoading,
      })}
    >
      {pathname.includes("/auth") ? null : (
        //프로필 정보 보여주기 위한 코드(#7.6)
        <Navigation
          isLoggedIn={isLoggedIn}
          username={loaderData.profile?.username}
          avatar={loaderData.profile?.avatar}
          name={loaderData.profile?.name}
          hasNotifications={loaderData.notificationsCount > 0}
          hasMessages={false}
        />
      )}
      {/* 모든 패지키로 유용한 여러 정보를 보내주고 있음(#8.9), #8.3 로그인여부등을 Outlet context로 담아줌 
      모든 route가 간단하게 사용자 로그인 여부를 알 수 있음
      */}
      <Outlet
        context={{
          isLoggedIn,
          name: loaderData.profile?.name,
          username: loaderData.profile?.username,
          avatar: loaderData.profile?.avatar,
          userId: loaderData.user?.id,
        }}
      />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
