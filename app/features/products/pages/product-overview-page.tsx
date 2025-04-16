import { useOutletContext } from "react-router";
import type { Route } from "./+types/product-overview-page";
import { makeSSRClient } from "~/supa-client";

/* #6.8 meta를 안에서 안하고 layout 하기 위해서 삭제
export const meta: Route.MetaArgs = () => {
  return [
    { title: "Product Overview | wemake" },
    { name: "description", content: "Product Overview" },
  ];
};
*/

/* #6.14
    event_data를 가지고 이 product가 실제로 존재하는지 확인할 수 있다.
*/
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  await client.rpc("track_event", {
    event_type: "product_view",
    event_data: {
      product_id: params.productId,
    },
  });
  return null;
};

//Layout Route : 페이지 안의 Header를 재사용하고 싶을 때
/* #6.8 overview layout 페이지 말고 여기서도 data 를 loader 로 가져올 수 있지만 비효율적이기 때문에 layout에서 데이터를 넘겨주는 방법
 */
export default function ProductOverviewPage() {
  /* #6.8 layout 에서 넘겨준 데이터를 받아줌 
  하지만 typescript에서 불평하고 있다. typescript는 이게 무슨 type 인지를 모르기 때문
  이게 전체 object를 아래로 보내지 않는 것을 추천하는 이유인데, 그렇게 하면 typescript에게 전체 object type을 알려줘야 하기 때문임
  const { product } = useOutletContext();
  */
  const { description, how_it_works } = useOutletContext<{
    description: string;
    how_it_works: string;
  }>();
  return (
    // header와 하단의 button 그리고 overview 분리, margin-top/margin-bottom 기능
    <div className="space-y-10">
      <div className="space-y-10">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">What is this product?</h3>
          <p className="text-sm font-light">{description}</p>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">How does it work?</h3>
          <p className="text-sm font-light">{how_it_works}</p>
        </div>
      </div>
    </div>
  );
}
