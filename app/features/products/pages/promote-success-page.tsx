import { z } from "zod";
import type { Route } from "./+types/promote-success-page";

const paramsSchema = z.object({
  paymentType: z.string(),
  orderId: z.string().uuid(),
  paymentKey: z.string(),
  amount: z.coerce.number(),
});

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const { success, data } = paramsSchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  if (!success) {
    return new Response(null, { status: 400 });
  }

  //키를 가지고 base64로 변환해야 함. 이 secret key를 이용하면 Toss 웹사이트랑 통신할 수 있음
  const encryptedSecretKey = `Basic ${Buffer.from(
    TOSS_SECRET_KEY + ":"
  ).toString("base64")}`;
  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: encryptedSecretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: data.orderId,
        paymentKey: data.paymentKey,
        amount: data.amount,
      }),
    }
  );
  const responseData = await response.json();
  //#13.3 중요한 점 : 응답값 중에 promotionFrom과 promotionTo값을 확인하고,
  //백엔드에서 이 값을 계산해서 사용자가 실제로 결제한 프로모션 일수와 계산이 맞는지 확인해야 함(절대로 사용자를 믿지 마라!)
  //응답값은 데이터베이스의 payments 테이블 같은 곳에 저장해야함(결제한 내역 확인등) vat, currency, metadata등 저장
  return Response.json(responseData);
};
