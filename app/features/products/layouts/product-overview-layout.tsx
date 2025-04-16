import { ChevronUpIcon, StarIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import { Button, buttonVariants } from "~/common/components/ui/button";
import type { Route } from "./+types/product-overview-layout";
import { cn } from "~/lib/utils";
import { getProductById } from "../queries";
import { makeSSRClient } from "~/supa-client";
//#6.8 layout meta, overview meta 두개가 있을 경우 overview meta가 우선되었다. MetaArgs에서는 데이터를 갖고 있다.
export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data.product.name} Overview | wemake` },
    { name: "description", content: data.product.description },
  ];
}

//#6.8
export async function loader({ request, params }: Route.LoaderArgs) {
  const { client } = makeSSRClient(request);
  const product = await getProductById(client, {
    productId: Number(params.productId),
  });
  console.log(product);
  return { product };
}

export default function ProductOverviewLayout({
  loaderData,
}: Route.ComponentProps) {
  return (
    // 이렇게 Outlet 을 넣어주면 모든 것이 저 구멍안에서 render 됨
    <div className="space-y-10">
      {/* // 상품 header */}
      <div className="flex justify-between">
        <div className="flex gap-10">
          <div className="size-40 rounded-xl shadow-xl bg-primary/50 overflow-hidden">
            <img
              src={loaderData.product.icon}
              alt={loaderData.product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-5xl font-bold">{loaderData.product.name}</h1>
            <p className="text-2xl  font-light">
              {loaderData.product.description}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  //fill 속성은 아이콘을 채우는 속성
                  <StarIcon
                    key={index}
                    className="size-4"
                    fill={
                      index < Math.floor(loaderData.product.average_rating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>
              <p className="text-sm font-light">
                {loaderData.product.reviews} reviews
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-5">
          <Button
            variant="secondary"
            size="lg"
            className="text-lg h-14 px-10"
            asChild
          >
            <Link to={`/products/${loaderData.product.product_id}/visit`}>
              Visit Website
            </Link>
          </Button>
          <Button size="lg" className="text-lg h-14 px-10">
            <ChevronUpIcon className="size-4" />
            Upvote ({loaderData.product.upvotes})
          </Button>
        </div>
      </div>
      {/* // 상품 소개 */}
      <div className="flex gap-2.5">
        {/* 
        NavLink Component는 이름 그대로의 역할을 해(Navigation Link) 
        component의 Link와 현재 URL의 Link가 같은지를 나타낼 수 있어(Overview 선택하면 Overview 선택된 UI등)
        className은 text 일수도 있지만, function 형태로도 사용할 수 있음 > return 은 string 으로 해야함
        isActive : link의 URL이 현재 위치와 일치하는지 알려주는 값
        asChild를 설정해줘서 작동하지 않음(NavLink) > Button을 삭제
        Button 처럼 보이고 싶어서 button styles function 사용(Button 컴포넌트를 생성하지 않아도 Button의 모든 ClassName 을 제공해줌)
      */}
        <NavLink
          className={({ isActive }) =>
            cn([
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            ])
          }
          to={`/products/${loaderData.product.product_id}/overview`}
        >
          Overview
        </NavLink>

        {/* 
        언제 asChild를 써야 할까?
         Button을 <a>, <Link> 등의 네비게이션 컴포넌트로 감싸야 할 때
         Button 내부의 요소가 자체적인 동작을 가지고 있어서 버튼의 기본 동작을 방해받지 않도록 해야 할 때
        이런 경우 asChild를 사용하면 Button의 스타일과 속성을 유지하면서도, 내부 요소가 원래 의도한 대로 동작하도록 만들 수 있습니다. 
        */}

        <NavLink
          className={({ isActive }) =>
            cn([
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            ])
          }
          to={`/products/${loaderData.product.product_id}/reviews`}
        >
          Reviews
        </NavLink>
      </div>
      {/* #6.8 이 Outlet 으로 render가 되는 모든 children에 product를 context로 보낼 수 있음. object 전체를 보내는 것 보다 개별로 보내는 것이
      typescript에게 더 좋은 방법임 */}
      <Outlet
        context={{
          product_id: loaderData.product.product_id,
          description: loaderData.product.description,
          how_it_works: loaderData.product.how_it_works,
          reviews: loaderData.product.reviews,
        }}
      />
    </div>
  );
}
