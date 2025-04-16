import { makeSSRClient } from "~/supa-client";

export const checkUsernameExists = async (
  request: Request,
  { username }: { username: string }
) => {
  const { client } = makeSSRClient(request);
  //오류가 발생한다면 해당 사용자 이름이 profile 테이블에 존재하지 않는다(#7.5)
  const { data, error } = await client
    .from("profiles")
    .select("profile_id")
    .eq("username", username)
    .single();
  if (error) {
    return false;
  }
  return true;
};
