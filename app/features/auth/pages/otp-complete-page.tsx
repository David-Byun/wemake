import { Form, redirect, useNavigation, useSearchParams } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import { Button } from "~/common/components/ui/button";
import type { Route } from "./+types/otp-complete-page";
import { z } from "zod";
import { makeSSRClient } from "~/supa-client";
import { LoaderIcon } from "lucide-react";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Verify OTP | wemake" }];
};

//#7.10 아래 코드들은 이메일 말고 전화번호를 받는 코드로 수정했음
const formSchema = z.object({
  // email: z.string().email(),
  phone: z.string(),
  otp: z.string().min(6).max(6),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const { data, success, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return { fieldErrors: error.flatten().fieldErrors };
  }
  // const { email, otp } = data;
  const { phone, otp } = data;
  // #7.9
  // otp를 검증하고 otp와 이메일을 가져오면 결과적으로 사용자가 로그인 상태가 되어야함.
  // 사용자가 로그인하면 헤더에 쿠키가 설정돼야 하기 때문에 headers를 가져와야함
  const { client, headers } = makeSSRClient(request);

  const { error: verifyError } = await client.auth.verifyOtp({
    // email,
    phone,
    token: otp,
    //타입 올려보면 여러 타입을 선택할 수 있음
    // type: "email",
    type: "sms",
  });
  if (verifyError) {
    return { verifyError: verifyError.message };
  }
  return redirect("/", { headers });
};

export default function OtpCompletePage({ actionData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  // const email = searchParams.get("email");
  const phone = searchParams.get("phone");
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="flex items-center justify-center gap-10 flex-col max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Comfirm OTP</h1>
          <p className="text-muted-foreground">
            Please enter the 4-digit code sent to your email.
          </p>
        </div>
        <Form className="w-full space-y-4" method="post">
          <InputPair
            id="phone"
            label="Phone"
            description="Enter your phone number"
            name="phone"
            required
            placeholder="i.e 01012345678"
            defaultValue={phone || ""}
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-destructive">
              {actionData.fieldErrors?.phone?.join(", ")}
            </p>
          )}
          <InputPair
            id="otp"
            label="OTP"
            description="Enter the 6-digit code sent to your phone"
            name="otp"
            required
            placeholder="i.e 123456"
          />
          {actionData && "fieldErrors" in actionData && (
            <p className="text-destructive">
              {actionData.fieldErrors?.otp?.join(", ")}
            </p>
          )}
          {actionData && "verifyError" in actionData && (
            <p className="text-destructive">{actionData.verifyError}</p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              "Confirm OTP"
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
