import { redirect } from "react-router";
import type { Route } from "./+types/profile-page";
import { makeSSRClient } from "~/supa-client";
import { getUserById } from "../queries";

/* 모든 loader와 action은 퍼블릭(public) 이기 때문에 호출하는 사용자가 실제 호출할 권한이 있는지 항상 확인해야 함(#7.6)
    브라우저만 있으면 loader의 URL을 알고 있는 경우 그 URL에 그냥 접근할 수 있음.
    loader와 action을 서버에서의 퍼블릭 API 앤드포인트처럼 다뤄야함
    ex) 상품을 업로드 할때 가장 먼저 해야할 일은 사용자가 로그인되어 있는지 확인
*/
export async function loader({ request }: Route.LoaderArgs) {
  /* find user using the cookies
  'nico' 부분의 username은 나중에 쿠키에서 가져올 거다.
  root.tsx로 가서 로그인되었다고 해야 하니까 isLoggedIn에 true를 넣어줘야 한다.
  */
  const { client } = makeSSRClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user) {
    const profile = await getUserById(client, { id: user.id });
    return redirect(`/users/${profile.username}`);
  }
  return redirect(`/auth/login`);
}

export default function MyProfilePage() {
  return <div>My Profile Page</div>;
}
