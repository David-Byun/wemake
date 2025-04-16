import { z } from "zod";
import type { Route } from "./+types/social-start-page";
import { redirect } from "react-router";
import { makeSSRClient } from "~/supa-client";

const paramsSchema = z.object({
  provider: z.enum(["github", "kakao"]),
});

export async function loader({ params, request }: Route.LoaderArgs) {
  const { success, data } = paramsSchema.safeParse(params);
  if (!success) {
    return redirect("/auth/login");
  }
  const { provider } = data;
  const redirectTo = `http://localhost:5173/auth/social/${provider}/complete`;
  const { client, headers } = makeSSRClient(request);
  /* #7.7
  SignInWithOAuth는 사용자를 로그인하게 만들 URL을 포함한 응답을 반환하는 프로미스를 줄거다. 
  github으로 로그인한다면 클라이언트가 그 사용자를 보내야 할 URL을 반환해줌
  사용자는 그 URL로 가서 로그인하면 됨
  */
  const {
    data: { url },
    error,
  } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  /* #7.7 중요한 점은 headers를 포함해서 리다이렉트 해야함. 그 이유는 서버 측의 supabase client가 쿠키를 설정하기 때문이다. 
  이 쿠키는 브라우저가 github과 로그인 과정을 시작했다는 걸 클라이언트에게 알려주는 역할을 한다. 그래서 github으로 로그인 과정을 시작하면
  supabase가 브라우저에 쿠키를 넣어줄 거다. github에서 돌아왔을 때 supabase client는 같은 기기에서 github으로 로그인과정을 시작했다는 걸 알 수 있음
  이렇게 하는 이유는 기본적으로 사람들이 로그인 과정을 시작하고 완료하는 걸 같은 기기에서 하도록 강제하기 위함. (보안상의 이유)

  로그인 > github 로그인 페이지 > complete 페이지로 코드를 가지고 redirect됨
  */

  if (url) {
    return redirect(url, { headers });
  }
  if (error) {
    throw error;
  }
}

export function SocialStartPage({}: Route.ComponentProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Social Login</h1>
    </div>
  );
}
