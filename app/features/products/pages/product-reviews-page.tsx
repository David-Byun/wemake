import { Button } from "~/common/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ReviewCard } from "~/features/products/components/review-card";
import { Dialog, DialogTrigger } from "~/common/components/ui/dialog";
import { CreateReviewDialog } from "../components/create-review-dialog";
import { useOutletContext } from "react-router";
import type { Route } from "./+types/product-reviews-page";
import { getReviews } from "../queries";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";
import { z } from "zod";
import { createProductReview } from "../mutations";
import { useEffect, useState } from "react";
export function meta() {
  return [
    { title: "Product Reviews | wemake" },
    { name: "description", content: "Product Reviews" },
  ];
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const reviews = await getReviews(client, {
    productId: Number(params.productId),
  });
  return { reviews };
};

const formSchema = z.object({
  review: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
});

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { success, data, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return {
      formErrors: error.flatten().fieldErrors,
    };
  }
  await createProductReview(client, {
    productId: Number(params.productId),
    userId,
    rating: data.rating,
    review: data.review,
  });
  return { ok: true };
};

export default function ProductReviewsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { reviews } = useOutletContext<{ reviews: string }>();
  //#8.6 리뷰작성 후에 dialog 닫기를 하기 위해서 dialog 열었는지 아닌지 확인
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (actionData?.ok) {
      setOpen(false);
    }
  }, [actionData]);
  return (
    /* 
      shadcn이 제공하는 Dialog 라는 아주 멋진 Component 존재 
      DialogContent가 해당 Dialog 본문이라는 것과 DialogTrigger는 Dialog를 여는 역할을 하고 반드시 Dialog Component 내부에 위치해야함
      shadcn의 dialog component 부분을 읽어보면 열리고 닫히는 것을 컨트롤 할 수 있음
    */
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="space-y-10 max-w-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {reviews} {reviews === "1" ? "Review" : "Reviews"}
          </h2>
          <DialogTrigger>
            <Button variant="secondary">
              <PlusIcon className="size-4" />
              Add Review
            </Button>
          </DialogTrigger>
        </div>
        <div className="space-y-20">
          {/* 먼저 UI 만들어 놓고 command + i 활용해서 컴포넌트 생성 */}
          {loaderData.reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              authorName={review.user?.name ?? "Anonymous"}
              username={review.user?.username ?? "Anonymous"}
              avatarUrl={review.user?.avatar ?? ""}
              rating={review.rating}
              content={review.review}
              createdAt={review.created_at}
            />
          ))}
        </div>
      </div>
      <CreateReviewDialog />
    </Dialog>
  );
}
