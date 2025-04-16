import { data, redirect } from "react-router";
import type { Route } from "./+types/leaderboards-redirection-page";
import { DateTime } from "luxon";
import { makeSSRClient } from "~/supa-client";
/* Luxon : Javascript 라이브러리로 날짜 처리를 쉽게 할 수 있음 
params : URL Parameter 을 가져옴
request : 헤더, 쿠키등을 가져옴
*/
export function loader({ request, params }: Route.LoaderArgs) {
  const { client } = makeSSRClient(request);
  const { period } = params;
  let url: string;
  const today = DateTime.now().setZone("Asia/Seoul");
  if (period === "daily") {
    url = `/products/leaderboard/daily/${today.year}/${today.month}/${today.day}`;
  } else if (period === "weekly") {
    url = `/products/leaderboard/weekly/${today.year}/${today.weekNumber}`;
  } else if (period === "monthly") {
    url = `/products/leaderboard/monthly/${today.year}/${today.month}`;
  } else if (period === "yearly") {
    url = `/products/leaderboard/yearly/${today.year}`;
  } else {
    // data 함수 : response 를 반환할 수 있게 해주는 단축키 같은 함수
    return data(null, { status: 404 });
  }
  return redirect(url);
}
