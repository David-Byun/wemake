import { Button } from "~/common/components/ui/button";
import type { Route } from "./+types/login-page";
import { Form, Link, redirect, useNavigation } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import AuthButtons from "../component/auth-buttons";
import { LoaderIcon } from "lucide-react";
import { z } from "zod";
import { makeSSRClient } from "~/supa-client";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Login | wemake" }];
};

//form 데이터는 검증해줘야함(#7.4). 데이터를 받아서 파싱하고 파싱한 데이터를 supabase에 넘겨줄거다.
const formSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email should be a string",
    })
    .email("Invalid email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, { message: "Password must be at least 8 characters long" }),
});

//이 페이지에서 post 요청을 처리하고 싶다면 action 함수를 만들어주면 됨(#7.3). action 함수를 만들어주기만 하면 프레임워크가 자동으로 둘을 이어줌
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const { success, data, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    //zod 좋은 점은 스키마를 생성할 때 특정 에러를 지정해줄 수 있다. error.flatten()은 모든 에러를 하나의 객체로 묶어준다.
    //fieldErrors : 에러들을 배열로 바꿔준다(#7.4)
    return {
      formErrors: error.flatten().fieldErrors,
      loginError: null,
    };
  }
  const { email, password } = data;
  //로그인을 하고 있기 때문에 클라이언트가 유저의 쿠키를 설정해줘야함(#7.4)
  const { client, headers } = makeSSRClient(request);
  // 위 에러랑 변수명이 겹쳐서 loginError로 변경
  const { error: loginError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  /*타입스크립트를 만족시키면서 작업하길 바란다. 하나의 action에서 한 곳에서는 formErrors, 다른 곳에서는 loginError를 return 하고 있다면,
  null이라도 각각 붙여줘서 통일시킨다.(#7.4)
  ex) return {
    formErrors: null,
    loginError: loginError.message,
  }
  */
  if (loginError) {
    return {
      formErrors: null,
      loginError: loginError.message,
    };
  }
  /* 중요한 것은 redirect 하면서 header를 넘겨줘야함(#7.4) 헤더를 전달하는 이유는 사용자가 올바르게 로그인했다면 클라이언트가 쿠키를 설정할거기 때문
  (위 client.auth.signInWithPassword 함수)
  브라우저에서 쿠키를 확인할 수 있어야 하고, 네비게이션 바도 로그인 유저를 위한 걸로 바뀌어 있어야함
  */
  return redirect("/", {
    headers,
  });
};

//loader 함수처럼 action에서 return 하는 것들을 여기 props으로 받아올 수 있다(#7.3)
export default function LoginPage({ actionData }: Route.ComponentProps) {
  // 아래 처럼 하면 우리가 제출중인지 아닌지 알 수 있음(#7.3)
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading"; //submitting외 홈페이지 로딩중에도 사용하려고 추가(#7.5)
  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <Button variant={"ghost"} asChild className="absolute top-8 right-8">
        <Link to="/auth/join">Join</Link>
      </Button>
      <div className="flex items-center justify-center gap-10 flex-col max-w-md w-full">
        <h1 className="text-2xl font-semibold">Log in to your account</h1>
        {/* 아래 Form 컴포넌트를 이용하면 예를 들어 제출이 로딩중일 때 유저에게 로딩 스피너를 보여주는 등의 일을 할 수 있음(#7.3) 
        method는 default로 'get'
        action을 위해서 input name을 제대로 써줘야만 formData 안에 포함됨
        폼은 제출되지만, 자바스크립트를 사용하게 됨. 차이점은 전체 새로고침이 아니고 fetch를 사용하고 action 함수로부터 결과를 받아올 수 있다.
        */}
        <Form className="w-full space-y-4" method="post">
          <InputPair
            id="email"
            label="Email"
            description="Enter your email"
            name="email"
            required
            placeholder="i.e wemake@example.com"
          />
          {/* 이건 formErrors를 위한 내용. shadcn ui alert 컴포넌트 형태로 보여줘도 좋을듯 */}
          {actionData && "formErrors" in actionData && (
            <p className="text-sm text-red-500">
              {actionData.formErrors?.email?.join(", ")}
            </p>
          )}
          <InputPair
            id="password"
            label="Password"
            description="Enter your password"
            name="password"
            required
            placeholder="i.e *********"
          />
          {/* 이건 formErrors를 위한 내용 */}
          {actionData && "formErrors" in actionData && (
            <p className="text-sm text-red-500">
              {actionData.formErrors?.password?.join(", ")}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <LoaderIcon className="animate-spin" /> : "Log in"}
          </Button>
          {/* 이건 loginError를 위한 내용 */}
          {actionData && "loginError" in actionData && (
            <p className="text-sm text-red-500">{actionData.loginError}</p>
          )}
        </Form>
      </div>
      <AuthButtons />
    </div>
  );
}
