import { useOutletContext } from "react-router";
import type { Route } from "./+types/profile-page";
import { makeSSRClient } from "~/supa-client";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Profile | wemake" }];
};

/* #6.14
우린 지금 이 이벤트를 특정 username 기반으로 추적하고 있다(username이 변경된다면 이 profile_view 접근이 불가) 
** 챌린지 : username이 아닌 userId 기반으로 추적하는 것으로 변경하기 - track_event.sql (())
현재 상황에서는 username을 아무거나 넣어도 그 username으로 조회수를 추적하게 될 것임.
username을 받으면 userId로 변환해서 추적하는 것으로 변경하기
*/
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  await client.rpc("track_event", {
    event_type: "profile_view",
    event_data: {
      username: params.username,
    },
  });
  return null;
};

// #6.14 누군가 프로필 페이지에 접근한다면, 그 조회수를 추적하고 싶다(/users/:username)
export default function ProfilePage() {
  const { headline, bio } = useOutletContext<{
    headline: string;
    bio: string;
  }>();
  return (
    <div className="max-w-screen-md flex flex-col space-y-10">
      <div className="space-y-2">
        <h4 className="text-lg font-bold">Headline</h4>
        <p className="text-sm text-muted-foreground">{headline}</p>
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-bold">Bio</h4>
        <p className="text-sm text-muted-foreground">{bio}</p>
      </div>
    </div>
  );
}
