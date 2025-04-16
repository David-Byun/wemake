import { DateTime } from "luxon";
import { data, isRouteErrorResponse, Link } from "react-router";
import { z } from "zod";
import { PageHeader } from "~/common/components/page-header";
import { ProductCard } from "../components/product-card";
import { Button } from "~/common/components/ui/button";
import ProductPagination from "~/common/components/product-pagination";
import type { Route } from "./+types/yearly-leaderboards-page";
import { getProductPagesByDateRange, getProductsByDateRange } from "../queries";
import { makeSSRClient } from "~/supa-client";
// 매개변수 포맷 검증 : 검증을 위해서 zod 사용. routes.ts 는 열어둔다. cursor는 열려 있는 파일을 읽기 때문에
const paramsSchema = z.object({
  // 여기서는 매개변수가 날짜인데 문자열로 들어와서 숫자로 변환가능한 문자열인지 체크 필요
  year: z.coerce.number(),
});

export const meta: Route.MetaFunction = ({ params }) => {
  const date = DateTime.fromObject({
    year: Number(params.year),
  })
    .setZone("Asia/Seoul")
    .setLocale("ko");
  return [
    {
      title: `The best of ${date.toLocaleString({
        year: "numeric",
      })} | wemake`,
    },
  ];
};

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const { client } = makeSSRClient(request);
  // safeParse 의 결과는 success 와 data가 됨(data를 많이 사용해서 충돌이나기 때문에 닉네임을 표시해줌 parsedData). parsedData : year, month, day가 있는 객체
  const { success, data: parsedData } = paramsSchema.safeParse(params);
  if (!success) {
    throw data(
      {
        error_code: "invalid_date",
        message: "Invalid date",
      },
      { status: 400 }
    );
  }

  /* 사용자를 믿으면 안되기 때문에 체크 필요 
  오브젝트로부터 Date를 구성할 수 있도록 해줌 
  fromObject 함수는 객체를 날짜로 만들어주는 함수
  */
  const date = DateTime.fromObject({
    weekYear: parsedData.year,
  }).setZone("Asia/Seoul");
  if (!date.isValid) {
    /* error 
    발생시 문구는 root.tsx ErrorBoundary 에서 온거임
    ErrorBoundary 함수를 만들어서 해당 함수를 바라보게 할수도 있음
    loader 함수에서 에러가 났을때 가장 가까운 에러 바운더리가 렌더링되게 되어 있음
    */
    // import {data} from "react-router"
    throw data(
      {
        error_code: "invalid_date",
        message: "Invalid date",
      },
      { status: 400 }
    );
  }
  // 작성날짜가 미래인지 확인
  const today = DateTime.now().setZone("Asia/Seoul").startOf("year"); // 00:00:00 시간
  if (date > today) {
    throw data(
      {
        error_code: "future_date",
        message: "Future date",
      },
      { status: 400 }
    );
  }

  const products = await getProductsByDateRange(client, {
    startDate: date.startOf("year"),
    endDate: date.endOf("year"),
    limit: 15,
    page: Number(url.searchParams.get("page")) || 1,
  });

  const totalPages = await getProductPagesByDateRange(client, {
    startDate: date.startOf("year"),
    endDate: date.endOf("year"),
  });

  //매개변수 포맷 검증(많이 함) 예를 들어 yyyy/mm/dd 인 경우 - 검증을 위해서 zod 사용

  // 그냥 date로 반환하면 안되고 {date} 이런식으로 반환해야 함. date로만 반환하면 loaderData 에서 데이터로 받아올 수 없음
  return { ...parsedData, products, totalPages };
};

// ErrorBoundary 에서 에러를 처리해줘서 UI에서 별도로 에러 처리를 안해도 됨
export default function YearlyLeaderboardsPage({
  loaderData,
}: Route.ComponentProps) {
  // 모든 날짜를 .setZone('Asia/Seoul').setLocale('ko')로 하는건 비효율적이라서 root.tsx Layout에서 luxon Settings을 통해서 설정
  const urlDate = DateTime.fromObject({
    weekYear: loaderData.year,
  });

  const previousYear = urlDate.minus({ years: 1 });
  const nextYear = urlDate.plus({ years: 1 });
  // params 날이 오늘이라면 다음 날짜 버튼을 비활성화
  const isToday = urlDate.equals(DateTime.now().startOf("year"));
  return (
    <div className="space-y-10">
      {/* 날짜를 문자열로 바꿔주는데 특정한 언어와 포맷(형식)으로 localize 할 수 있는게 특징임 */}
      <PageHeader
        title={`The best of  year ${urlDate.startOf("year").toLocaleString({
          year: "numeric",
        })}`}
      />
      {/* 이전 날짜 & 다음 날짜 버튼*/}
      <div className="flex items-center justify-center gap-2">
        <Button variant="secondary" asChild>
          <Link to={`/products/leaderboards/yearly/${previousYear.year}`}>
            &larr;{" "}
            {previousYear.toLocaleString({
              year: "numeric",
            })}
          </Link>
        </Button>
        {!isToday ? (
          <Button variant="secondary" asChild>
            <Link to={`/products/leaderboards/yearly/${nextYear.year}`}>
              {nextYear.toLocaleString({
                year: "numeric",
              })}
              &rarr;
            </Link>
          </Button>
        ) : null}
      </div>

      {/* mx-auto 는 양쪽으로 마진을 줄 수 있음 */}
      <div className="space-y-5 w-full max-w-screen-md mx-auto">
        {loaderData.products.map((product) => (
          <ProductCard
            id={product.product_id}
            name={product.name}
            description={product.tagline}
            upvotes={product.upvotes}
            views={product.views}
            comments={product.reviews}
            key={product.product_id}
          />
        ))}
      </div>
      {/* npx shadcn@latest add pagination */}
      <ProductPagination totalPages={loaderData.totalPages} />
    </div>
  );
}

// ErrorBoundary 함수를 정의하지 않아도 default로 root 에서 캐치하기 때문에 해당 사항은 선택사항임
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // 에러가 발생했더라도 어느 종류의 에러인지 확인 필요 isRouteErrorResponse 4xx & 5xx 체크
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        Error: {error.data.message} / {error.data.error_code}
      </div>
    );
  }
  // throw new Error() 이런식으로 에러 발생시키면 에러가 여기 표시됨
  if (error instanceof Error) {
    return <div>{error.message}</div>;
  }
  return <div>Unknown error</div>;
}
