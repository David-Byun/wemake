import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/promote-page";
import SelectPair from "~/common/components/select-pair";
import { Calendar } from "~/common/components/ui/calendar";
import { Label } from "~/common/components/ui/label";
import React, { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import {
  loadTossPayments,
  type TossPaymentsWidgets,
} from "@tosspayments/tosspayments-sdk";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Promote Product | Product Hunt Clone" },
    { name: "description", content: "Promote your product" },
  ];
};

export default function PromotePage() {
  /* 
    react-date-picker 에서 오는 DateRange 타입으로 설정 
    DateRange : 사용자가 선택한 from과 to, 두개의 Date를 받게 됨
    둘다 잘 선택이 되었다면 Luxon을 사용해서 Luxon Date를 구성해서 그 사이에 며칠이 포함되는지 확인
  */
  const [promotionPeriod, setPromotionPeriod] = useState<
    DateRange | undefined
  >();
  /* 날짜 함수는 luxon을 사용해서 구성. luxon이 JS Date를 Luxon Date로 바꾸는 function을 가지고 있음. DateRange 타입이 Date 이기 때문에 변환 */
  const totalDays =
    promotionPeriod?.from && promotionPeriod?.to
      ? DateTime.fromJSDate(promotionPeriod.to).diff(
          DateTime.fromJSDate(promotionPeriod.from),
          "days"
        ).days
      : 0;
  //https://docs.tosspayments.com/guides/v2/payment-widget/integration
  const widget = useRef<TossPaymentsWidgets>(null);
  const initedToss = useRef<boolean>(false);
  useEffect(() => {
    const initToss = async () => {
      //토스 함수가 두번 실행되는 걸 수정하기 위한 방법(두번 실행되면 에러가 발생함)
      if (initedToss.current) return;
      initedToss.current = true;
      const toss = await loadTossPayments(
        "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"
      );
      widget.current = await toss.widgets({
        customerKey: "1111111",
      });
      //사용자가 우리에게 얼마나 돈을 지불해야 하는지 기본적으로 설정해야 함
      await widget.current.setAmount({
        value: 0,
        currency: "KRW",
      });
      //selector는 바로 toss-payment-methods라는 ID다.
      await widget.current.renderPaymentMethods({
        selector: "#toss-payment-methods",
        //variantKey를 활용하면 결제 위젯의 UI를 커스터마이징 할 수 있다. documentation 참고
      });
      await widget.current.renderAgreement({
        selector: "#toss-payment-agreement",
      });
    };
    initToss();
  }, []);
  //달력 기간을 조정하면 가격이 변하게
  useEffect(() => {
    //updateAmount로 만들고 비동기 함수(async)로 지정해야한다.
    const updateAmount = async () => {
      if (widget.current) {
        //setAmount는 반드시 Promise 여야 함
        await widget.current.setAmount({
          value: totalDays * 20000,
          currency: "KRW",
        });
      }
    };
    updateAmount();
  }, [promotionPeriod]);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const product = formData.get("product") as string;
    //from과 to 두개와 product를 다 체크해야 함
    if (!product || !promotionPeriod?.to || !promotionPeriod?.from) return;
    //documentation 참고
    await widget.current?.requestPayment({
      orderId: crypto.randomUUID(),
      orderName: "WeMake Promotion",
      customerEmail: "byundavid@naver.com",
      customerName: "David",
      customerMobilePhone: "01012345678",
      //meta 데이터가 중요한 이유는 만약 이걸 하지 않으면 사용자가 결제를 했을 때, 정확히 어떤 것에 대한 결제인지 알 수 없다.
      metadata: {
        product,
        //데이터베이스에서 쉽게 저장하고 처리할 수 있도록 아래처럼 처리
        promotionFrom: DateTime.fromJSDate(promotionPeriod.from).toISO(),
        promotionTo: DateTime.fromJSDate(promotionPeriod.to).toISO(),
        //window.location.origin 을 사용하면 현재 사용자가 있는 URL을 자동으로 가져올 수 있음. href하면 전부다
        //결제도 검증해야 한다! 만약 너가 toss 서버에서 결제 상태를 검증하지 않는다면, 누구든지 그 성공 페이지 URL을 직접 입력해서 들어올 수 있어.
        //반드시 토스 서버에 정확하게 물어봐야 한다.
        /* #13.3 강의에서 할 일은 loader 함수를 만들어서 URL에 있는 query parameter를 가져올 거다. 그리고 Toss API를 사용해서 서버에서 결제 정보를 가져옴 
        거기서 우리가 여기에다가 저장해둔 metadata를 추출할거다.
        */
      },
      successUrl: `${window.location.href}/success`,
      failUrl: `${window.location.href}/fail`,
    });
  };
  return (
    <div>
      <PageHeader
        title="Promote Your Product"
        subtitle="제품을 더 눈에 띄게 만들어 보세요"
      />
      {/* #13.2 우리가 더이상 데이터를 loader나 action 같은 곳으로 보내지 않을 거라서 form 으로 사용 */}
      <form className="grid grid-cols-6 gap-10" onSubmit={handleSubmit}>
        <div className="col-span-3 mx-auto flex flex-col gap-10 w-1/2 items-start">
          {/* #13.2 사용자 계정에서 product를 선택, 사용자가 먼저 product를 등록해놔야 그것을 promote 할 수 있음 
          SelectPair 값은 formData에 포함됨. 프로모션이 유지될 기간 같은 값은 state에 저장
          */}
          <SelectPair
            required
            label="Select a product"
            description="Select the product you want to promote."
            name="product"
            placeholder="Select a product"
            options={[
              {
                label: "AI Dark Mode Maker",
                value: "ai-dark-mode-maker",
              },
              // {
              //   label: "AI Image Generator",
              //   value: "ai-image-generator",
              // },
              // {
              //   label: "AI Text Generator",
              //   value: "ai-text-generator",
              // },
            ]}
          />
          <div className="flex flex-col gap-2 items-center w-full">
            <Label className="flex flex-col gap-1">
              홍보 기간을 선택해 주세요{" "}
              {/* small을 엔터형식으로 내리기 위한 block class */}
              <small className="text-muted-foreground  text-center">
                홍보 기간은 최소 4일 이상 이어야 합니다.
              </small>
            </Label>
            {/* 사용자가 기간을 선택하면 setPromotionPeriod가 호출되어 promotionPeriod state를 update 함 
            꼭 기억하기 : 캘린더는 입력 요소가 아니다. formData에 포함되지 않는다. 하지만 우리는 이 캘린더에서 선택한 값을 상태(state)에 저장하고 있음
            그리고 Button을 비활성화 하고 있는데, 즉 사용자가 날짜를 선택하지 않으면 폼을 제출할 수 없다.
            */}
            <Calendar
              mode="range"
              selected={promotionPeriod}
              onSelect={setPromotionPeriod}
              min={3}
              disabled={(date) => date < new Date()}
            />
            {/* 기간이 과거인 경우에는 disabled */}
          </div>
        </div>
        <aside className="col-span-3 px-20 flex flex-col  items-center">
          {/* Toss의 결제방법을 렌더링 */}
          <div id="toss-payment-methods" className="w-full" />
          {/* 결제 동의 조항 */}
          <div id="toss-payment-agreement" />
          {/* 이 버튼을 폼 안에서 클릭하면 폼이 제출되게 만들고 싶다 */}
          <Button disabled={totalDays === 0} className="w-full">
            결제하기 (
            {(totalDays * 20000).toLocaleString("ko-KR", {
              style: "currency",
              currency: "KRW",
            })}
            원)
          </Button>
        </aside>
      </form>

      {/* npx shadcn@latest add calendar */}
    </div>
  );
}
