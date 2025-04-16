import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/leaderboards-page";
import { ProductCard } from "../components/product-card";
import { Button } from "~/common/components/ui/button";
import { Link } from "react-router";
import { getProductsByDateRange } from "../queries";
import { DateTime } from "luxon";
import { makeSSRClient } from "~/supa-client";
/*  해야할 미션 #6.0
  1. 멋진 메시지 만드는 작업 : product 없는 경우 처리

*/
export const meta: Route.MetaFunction = () => {
  return [
    { title: "Leaderboards | wemake" },
    { name: "description", content: "Product leaderboards" },
  ];
};

// 페이지 속도 저하를 예방하기 위해 모든 await를 선택해서 삭제 #6.0
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  //병행처리(위치조심)
  const [dailyProducts, weeklyProducts, monthlyProducts, yearlyProducts] =
    await Promise.all([
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("day"),
        endDate: DateTime.now().endOf("day"),
        limit: 7,
      }),
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("week"),
        endDate: DateTime.now().endOf("week"),
        limit: 7,
      }),
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("month"),
        endDate: DateTime.now().endOf("month"),
        limit: 7,
      }),
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("year"),
        endDate: DateTime.now().endOf("year"),
        limit: 7,
      }),
    ]);
  /*
  const dailyProducts = await getProductsByDateRange({
    startDate: DateTime.now().startOf("day"),
    endDate: DateTime.now().endOf("day"),
    limit: 7,
  });

  const weeklyProducts = await getProductsByDateRange({
    startDate: DateTime.now().startOf("week"),
    endDate: DateTime.now().endOf("week"),
    limit: 7,
  });

  const monthlyProducts = await getProductsByDateRange({
    startDate: DateTime.now().startOf("month"),
    endDate: DateTime.now().endOf("month"),
    limit: 7,
  });

  const yearlyProducts = await getProductsByDateRange({
    startDate: DateTime.now().startOf("year"),
    endDate: DateTime.now().endOf("year"),
    limit: 7,
  });
*/
  return {
    dailyProducts,
    weeklyProducts,
    monthlyProducts,
    yearlyProducts,
  };
};
// abstract to /common/components use props for content
export default function LeaderboardsPage({ loaderData }: Route.ComponentProps) {
  /* 모든 페이지에서 재사용 가능한 컴포넌트 만듦 
  구조를 먼저 만들고 composer로 생성한 다음에 해당 컴포넌트를 import 해서 사용함*/
  return (
    <div className="space-y-20">
      <PageHeader
        title="Leaderboards"
        subtitle="The best products made by our community today."
      />
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Daily Leaderboard
          </h2>
          <p className="text-xl font-light text-foreground">
            The most popular products made by our community today.
          </p>
        </div>
        {loaderData.dailyProducts.map((product) => (
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
        <Button variant="link" className="text-lg self-center" asChild>
          <Link to="/products/leaderboards/daily">
            Explore all products &rarr;
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Weekly Leaderboard
          </h2>
          <p className="text-xl font-light text-foreground">
            The most popular products made by our community this week.
          </p>
        </div>
        {loaderData.weeklyProducts.map((product) => (
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
        <Button variant="link" className="text-lg self-center" asChild>
          <Link to="/products/leaderboards/weekly">
            Explore all products &rarr;
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Monthly Leaderboard
          </h2>
          <p className="text-xl font-light text-foreground">
            The most popular products made by our community this month.
          </p>
        </div>
        {loaderData.monthlyProducts.map((product) => (
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
        <Button variant="link" className="text-lg self-center" asChild>
          <Link to="/products/leaderboards/monthly">
            Explore all products &rarr;
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Yearly Leaderboard
          </h2>
          <p className="text-xl font-light text-foreground">
            The most popular products made by our community this year.
          </p>
        </div>
        {loaderData.yearlyProducts.map((product) => (
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
        <Button variant="link" className="text-lg self-center" asChild>
          <Link to="/products/leaderboards/yearly">
            Explore all products &rarr;
          </Link>
        </Button>
      </div>
    </div>
  );
}
