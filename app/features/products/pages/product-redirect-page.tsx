import { redirect } from "react-router";
import type { Route } from "./+types/product-redirect-page";

//loader 함수는 URL에 포함된 Parameter와 함께 호출됨
export const loader = ({ params }: Route.LoaderArgs) => {
  return redirect(`/products/${params.productId}/overview`);
};
