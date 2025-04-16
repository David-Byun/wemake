import { StarIcon } from "lucide-react";
import { useState } from "react";
import { Form, useActionData } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import { Button } from "~/common/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/common/components/ui/dialog";
import { Label } from "~/common/components/ui/label";
import type { action } from "../pages/product-reviews-page";

export function CreateReviewDialog() {
  const [rating, setRating] = useState<number>(0);
  //사용자가 별점을 마우스 오버 했을 때 별점을 표시하는 상태
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  //action 에러 넘겨주면 표시해주기
  const actionData = useActionData<typeof action>();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-2xl">
          What do you think of this product?
        </DialogTitle>
        <DialogDescription>
          Please fill in the form below to add a review.
        </DialogDescription>
      </DialogHeader>
      <Form className="space-y-10" method="post">
        <div>
          <Label className="flex flex-col gap-1">
            Rating
            <small className="text-muted-foreground">
              이 제품을 어떻게 평가하시나요 ?
            </small>
          </Label>
          {/* 별점 설정하는 방법 */}
          <div className="flex gap-2 mt-5">
            {[1, 2, 3, 4, 5].map((star) => (
              <label
                key={star}
                className="relative cursor-pointer"
                // hover 중인 위치를 알기 위함
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
              >
                {/* 색 채우는 방법 : fill 사용(svg에서 사용) */}
                <StarIcon
                  className="size-4 text-yellow-500"
                  fill={
                    hoveredStar >= star || rating >= star
                      ? "currentColor"
                      : "none"
                  }
                />
                {/* 간격이 큰 이유는 input 박스가 커서 그런것이므로, absolute, relative 를 통해서 조정 */}
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  required
                  className="opacity-0 h-px w-px absolute"
                  // 현재 rating을 알기 위한 것
                  onChange={() => setRating(star)}
                />
              </label>
            ))}
          </div>
          {actionData?.formErrors?.rating && (
            <p className="text-red-500">
              {/* 여러개의 에러가 발생할 수 있어서 .join(", ") 사용 */}
              {actionData.formErrors.rating.join(", ")}
            </p>
          )}
        </div>
        <InputPair
          label="Review"
          required
          name="review"
          placeholder="Tell us more about your experience"
          type="text"
          description="Max 1000 characters"
          textArea
        />
        {actionData?.formErrors?.review && (
          <p className="text-red-500">
            {actionData.formErrors.review.join(", ")}
          </p>
        )}
        <DialogFooter>
          <Button type="submit">Submit Review</Button>
        </DialogFooter>
      </Form>
    </DialogContent>
  );
}
