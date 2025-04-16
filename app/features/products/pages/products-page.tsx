import { redirect } from "react-router";

// Response.json({}) return 하면 API도 만들 수 있음
export function loader() {
  return redirect("/products/leaderboard");
}
