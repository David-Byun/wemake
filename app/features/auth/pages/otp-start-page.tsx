import { Button } from "~/common/components/ui/button";
import type { Route } from "./+types/otp-start-page";
import { Form, redirect, useNavigation } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import { z } from "zod";
import { makeSSRClient } from "~/supa-client";
import { LoaderIcon } from "lucide-react";

// #7.10 아래 코드는 이메일 입력받는 대신에 전화번호 입력으로 내용 수정
// const formSchema = z.object({
//   email: z.string().email(),
// });
const formSchema = z.object({
  phone: z.string(),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const { data, success } = formSchema.safeParse(Object.fromEntries(formData));
  if (!success) {
    // return { error: "Invalid email address" };
    return { error: "Invalid phone number" };
  }
  // const { email } = data;
  const { phone } = data;
  const { client } = makeSSRClient(request);

  const { error } = await client.auth.signInWithOtp({
    // email,
    phone,
    options: {
      //(#7.9)이 옵션을 true로 설정하면 만약 사용자가 이메일을 입력했는데 우리 데이터베이스에 그 이메일을 가진 사용자가 없다면,
      // supabase가 자동으로 사용자를 생성해준다. false로 설정하면 기존 계정을 가진 사용자만 OTP로 로그인할 수 있음
      shouldCreateUser: true,
    },
  });
  if (error) {
    return { error: "Failed to send OTP" };
  }
  // return redirect(`/auth/otp/complete?email=${email}`);
  return redirect(`/auth/otp/complete?phone=${phone}`);
};

export default function OtpStartPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="flex items-center justify-center gap-10 flex-col max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">OTP로 로그인하기</h1>
          <p className="text-muted-foreground">
            We will send you a 6-digit code to verify your account.
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
          />
          {/* 로딩 아이콘 만들어줘야함(#7.9) 계속 복사하지 말고 로딩 버튼 컴포넌트를 만들어야한다고 생각 */}
          {actionData && "error" in actionData && (
            <p className="text-destructive">{actionData.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              "Send OTP"
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
