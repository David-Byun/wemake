import { makeSSRClient } from "~/supa-client";
import type { Route } from "./+types/upvote-post-page";
import { getLoggedInUserId } from "~/features/users/queries";
import { toggleUpvote } from "../mutations";

//우린 여기에 어떤 UI도 만들지 않을 것이다(#9.1)
export const action = async ({ request, params }: Route.ActionArgs) => {
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }
  //formData로도 받을 수 있지만 다른 방법 사용
  // const formData = await request.formData();
  // const postId = formData.get("postId");
  const { client } = await makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  await toggleUpvote(client, { postId: params.postId, userId });
  return {
    ok: true,
  };
};
