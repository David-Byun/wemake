import type { Route } from "./+types/search-page";
import { z } from "zod";
import { PageHeader } from "~/common/components/page-header";
import { ProductCard } from "../components/product-card";
import ProductPagination from "~/common/components/product-pagination";
import { Form } from "react-router";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { getPagesBySearch, getProductsBySearch } from "../queries";
import { makeSSRClient } from "~/supa-client";
export const meta: Route.MetaFunction = () => {
  return [
    { title: "Search Products | wemake" },
    { name: "description", content: "Search for products" },
  ];
};

// input 은 항상 유효성 검증 해야함
const paramsSchema = z.object({
  query: z.string().optional().default(""),
  page: z.coerce.number().optional().default(1),
});

export async function loader({ request }: Route.LoaderArgs) {
  /* 
  search parameter validate 
  search parameter는 request를 통해 전달됨.
  params를 통해서 오는 것이 아님(url을 통해서 받는 parameter : params)
 */
  const url = new URL(request.url);

  /* 
    zod를 사용해서 paramsSchema는 object이지만 searchParams는 URLSearchParams {'query' > 'dark'} 같은 class 형태이므로 object 형변환 필요 
    console.log(Object.fromEntries(url.searchParams), url.searchParams);
    { query: 'dark' } URLSearchParams { 'query' => 'dark' }

    paramsSchema.safeParse를 할때 Object.fromEntries(url.searchParams)을 validate 하는 것뿐만 아니라 transform도 해줌
    validate 및 transform 처리가 된 데이터는 여기 있는 parsedData에 저장됨
  */
  const { success, data: parsedData } = paramsSchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  if (!success) {
    /* 
      데이터를 throw 할때 custom error message 를 보내고 싶다면, 
      data({error: 'custom error message'}) 이런식으로 error_code나 error_message를 갖게 만들 수 있음
      그런게 필요 없다면 그냥 throw new Error를 해줘도 됨
    */
    throw new Error("Invalid search parameters");
  }
  console.log(parsedData);
  if (parsedData.query === "") {
    return { products: [], totalPages: 1 };
  }
  const { client } = makeSSRClient(request);
  const products = await getProductsBySearch(client, {
    query: parsedData.query,
    page: parsedData.page,
  });
  const totalPages = await getPagesBySearch(client, {
    query: parsedData.query,
  });
  return { products, totalPages };
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <PageHeader
        title="Search"
        subtitle="Search for products by title or description"
      />
      {/* 
        react router가 제공하는 Form component가 있는데 이는 html form 태그와는 다르다 
        npx shadcn@latest add input
      */}
      <Form className="flex justify-center max-w-screen-sm items-center mx-auto gap-2">
        <Input
          name="query"
          placeholder="Search for products"
          className="text-lg"
        />
        <Button type="submit">Search</Button>
      </Form>

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
