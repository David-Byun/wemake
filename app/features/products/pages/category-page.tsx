import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/category-page";
import { ProductCard } from "../components/product-card";
import ProductPagination from "~/common/components/product-pagination";
import {
  getCategory,
  getCategoryPages,
  getProductsByCategory,
} from "../queries";
import { z } from "zod";
import { makeSSRClient } from "~/supa-client";
export const meta = ({ params }: Route.ComponentProps) => {
  return [
    { title: "Developer Tools| Product Hunt Clone" },
    { name: "description", content: "Products in this category" },
  ];
};

//validate 하는건 좋은 습관. url 로부터 받는 category 는 string 이므로 숫자로 변환해줘
const paramsSchema = z.object({
  category: z.coerce.number(),
});

//route("/:category", "features/products/pages/category-page.tsx"), :category 부분을 가져오는 것
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  //searchParams validation 넣기 (다른데 참고)
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const { client } = makeSSRClient(request);
  const { data, success } = await paramsSchema.safeParseAsync(params);
  if (!success) {
    throw new Response("Not Found", { status: 404 });
  }
  //아래 세개 불러오는 거에서 Promise all 로 묶어서 한번에 불러오기 조치 필요 - 홈도 해야함
  const category = await getCategory(client, { categoryId: data.category });
  const products = await getProductsByCategory(client, {
    categoryId: data.category,
    page: Number(page),
  });
  const totalPages = await getCategoryPages(client, {
    categoryId: data.category,
  });
  return { category, products, totalPages };
};

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <PageHeader
        title={loaderData.category.name}
        subtitle={loaderData.category.description}
      />
      {/* 
      react router가 제공하는 Form component가 있는데 이는 html form 태그와는 다르다 
      npx shadcn@latest add input
    */}

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
      <ProductPagination totalPages={loaderData.totalPages} />
    </div>
  );
}
