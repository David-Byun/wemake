import { z } from "zod";
import type { Route } from "./+types/social-complete-page";
import { redirect } from "react-router";
import { makeSSRClient } from "~/supa-client";

const paramsSchema = z.object({
  provider: z.enum(["github", "kakao"]),
});

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { success, data } = paramsSchema.safeParse(params);
  if (!success) {
    return redirect("/auth/login");
  }
  const { provider } = data;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return redirect("/auth/login");
  }
  const { client, headers } = makeSSRClient(request);
  //코드를 세션으로 교환한다(#7.7). 사용자를 로그인시키는 거임.
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    throw error;
  }
  //헤더를 반환시켜야 하는데, 코드를 세션으로 교환하면 기본적으로 사용자를 로그인시키는 거기 때문이다(#7.7) 그래서 클라이언트는 쿠키를 설정하려고 할거다.
  // 이 쿠키는 사용자가 로그인됐다는걸 알려주는 역할을 함. 그래서 우리가 쿠키가 포함한 헤더를 함께 보내야 하는거다.
  // 다만, 성공하더라도 profile에는 추가되지 않았기 때문에 에러가 나는데, user_to_profile_trigger 코드를 추가해줘야 한다.
  return redirect("/", { headers });
};
