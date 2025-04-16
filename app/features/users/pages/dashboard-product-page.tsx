import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/common/components/ui/chart";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "../queries";
import type { Route } from "./+types/dashboard-page";
import { redirect } from "react-router";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  //이 페이지에 접근하려면 로그인도 해야하지만, 이 product의 소유자여야만 한다.
  const { error } = await client
    .from("products")
    .select("product_id")
    .eq("profile_id", userId)
    .eq("product_id", Number(params.productId))
    .single();
  //에러 의미 : 이 사용자는 자신이 만들지 않은 제품의 통계를 보려고 한다는 뜻이다.
  if (error) {
    throw redirect("/my/dashboard/products");
  }
  const { data, error: rcpError } = await client.rpc("get_product_stats", {
    product_id: params.productId!,
  });
  if (rcpError) {
    throw new Error("Failed to fetch product stats");
  }
  return { chartData: data };
};

const chartConfig = {
  views: {
    label: "Page Views",
    color: "hsl(var(--chart-1))",
  },
  visitors: {
    label: "Visitors",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function DashboardProductPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <Card className="w-1/2">
        <CardHeader>
          <CardTitle>Profile Views</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart
              accessibilityLayer
              margin={{
                left: 12,
                right: 12,
              }}
              data={loaderData.chartData}
            >
              <CartesianGrid vertical={false} />
              {/* XAxis는 data 객체에서 어떤 key를 보여주는 것인지 알아야함. key가 data object에 존재하는지 확인 */}
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                padding={{ left: 15, right: 15 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Area
                dataKey="product_views"
                type="natural"
                stroke="var(--color-views)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                dataKey="product_visitors"
                type="natural"
                stroke="var(--color-visitors)"
                fill="var(--color-visitors)"
                strokeWidth={2}
                dot={false}
              />
              <ChartTooltip
                cursor={false}
                wrapperStyle={{ minWidth: "250px" }}
                content={<ChartTooltipContent indicator="line" />}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
