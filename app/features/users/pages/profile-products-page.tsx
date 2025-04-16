import { ProductCard } from "~/features/products/components/product-card";
import type { Route } from "./+types/profile-page";
import { getUserProducts } from "../queries";
import { makeSSRClient } from "~/supa-client";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const products = await getUserProducts(client, {
    username: params.username,
  });
  return { products };
};

export default function ProfileProductsPage({
  loaderData,
}: Route.ComponentProps) {
  //home-page에서 product-card 컴포넌트 가져오기
  return (
    <div className="flex flex-col gap-5">
      {loaderData &&
        loaderData.products.map((product: any) => (
          <ProductCard
            id={product.product_id}
            name={product.name}
            description={product.tagline}
            upvotes={product.upvotes}
            views={product.views}
            comments={product.comments}
            key={product.product_id}
          />
        ))}
    </div>
  );
}
