import { data, Outlet } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/leaderboard-layout";
// #6.1 /products/leaderboards/daily/2025/3/8?page=1 이런식으로 들어오는 매개변수 포맷 검증
// 페이지는 양수이기 때문에 min(1) 추가
const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  /* 
    searchParamsSchema.safeParse()
    Zod 라이브러리의 검증 메서드입니다
    데이터가 스키마와 일치하는지 안전하게 검사합니다
    성공하면 { success: true, data: 검증된데이터 }
    실패하면 { success: false, error: 에러객체 } 를 반환합니다
  */
  const { success: pageParseSuccess, data: parsedPage } =
    /* Object.fromEntries() : URLSearchParams를 일반 JavaScript 객체로 변환합니다
    url.searchParams: ?name=john&age=25 결과  { name: "john", age: "25" } */
    searchParamsSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!pageParseSuccess) {
    throw data(
      {
        error_code: "invalid_search_params",
        message: "Invalid search params",
      },
      { status: 400 }
    );
  }
};

export default function LeaderboardLayout() {
  return <Outlet />;
}
