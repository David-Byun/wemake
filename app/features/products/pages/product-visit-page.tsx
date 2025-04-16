/* #6.14 UI가 없는 페이지로, 우린 URL에서 product id를 가져오고 
데이터베이스에서 정보를 찾은 다음 해당 제품의 URL을 찾아서 유저를 그 URL로 보낼 거다
하지만 우리가 이벤트를 생성한 후에야 보내줄 거다. */

import { makeSSRClient } from "~/supa-client";
import type { Route } from "./+types/product-visit-page";
import { redirect } from "react-router";

//이 페이지는 /:productId/visit이고, 우린 로직을 실행하고 유저를 URL로 보낸다.
export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const { error, data } = await client
    .from("products")
    .select("url")
    .eq("product_id", Number(params.productId))
    .single();
  if (error) {
    throw error;
  }
  if (data) {
    await client.rpc("track_event", {
      event_type: "product_visit",
      event_data: {
        product_id: params.productId,
      },
    });
    return redirect(data.url);
  }
};
