import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/join-page";
import { InputPair } from "~/common/components/input-pair";
import { Button } from "~/common/components/ui/button";
import AuthButtons from "../component/auth-buttons";
import { z } from "zod";
import { checkUsernameExists } from "../queries";
import { makeSSRClient } from "~/supa-client";
import { LoaderIcon } from "lucide-react";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Join | wemake" }];
};

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  //데이터는 zod의 safeParse 메서드로 만들어져서 검증된 데이터라는걸 기억
  const { success, data, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return {
      formErrors: error.flatten().fieldErrors,
    };
  }
  const usernameExists = await checkUsernameExists(request, {
    username: data.username,
  });
  if (usernameExists) {
    return { formErrors: { username: ["Username already exists"] } };
  }
  //supabase에서는 사용자를 위한 계정을 생성할 때, 그 사용자를 동시에 로그인 상태로 만들어 준다(#7.5)
  const { client, headers } = makeSSRClient(request);
  // 이메일과 비밀번호로 사용자를 가입시키는 동시에, 몇 가지 custom data를 추가로 보낼수도 있음(#7.5)
  const { error: signUpError } = await client.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      /* supabase user쪽 데이터에 json을 보면 raw_user_metadata 필드가 있는데, 이 필드에 사용자 정보를 저장할 수 있음(#7.5)
      이 데이터는 나중에 social providers에 의해 채워질 것이고, 여기에는 Supabase가 사용자의 소셜 프로필 정보를 저장하는 곳이다.
      그래서 이 데이터에는 우리가 원하는 custom data를 넘겨줄 수 있다.
      아래에서는 username과 password로 사용자를 생성할때 우리가 전달한 데이터는 여기에 저장이 되고 나중에 우리의 trigger에서 사용 가능
      원하는 데이터를 json 형태로 저장할 수 있다.
      */
      data: { name: data.name, username: data.username },
    },
  });
  if (signUpError) {
    /* 로그인페이지에서 우리가 loginError를 처리하는 방식과 같다.
    폼의 각 필드마다 에러를 처리하는 form errors와 Supabase에서 발생할 수 있는 전역적인 에러를 처리하는 글로벌 에러(#7.5)
    */
    return { signUpError: signUpError.message };
  }
  //사용자를 로그인하거나 로그아웃 상태로 만들 때, 쿠키가 설정되거나 삭제되는 것 잊지 말기(#7.5)
  return redirect("/", { headers });
};

export default function JoinPage({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" || navigation.state === "loading";
  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <Button variant={"ghost"} asChild className="absolute top-8 right-8">
        <Link to="/auth/login">Login</Link>
      </Button>
      <div className="flex items-center justify-center gap-10 flex-col max-w-md w-full">
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <Form className="w-full space-y-4" method="post">
          <InputPair
            id="name"
            label="Name"
            description="Enter your name"
            name="name"
            required
            type="text"
            placeholder="i.e John Doe"
          />
          {actionData && "formErrors" in actionData && (
            <div className="text-red-500">{actionData.formErrors?.name}</div>
          )}
          <InputPair
            id="username"
            label="Username"
            description="Enter your username"
            name="username"
            required
            type="text"
            placeholder="i.e wemake"
          />
          {actionData && "formErrors" in actionData && (
            <div className="text-red-500">
              {actionData.formErrors?.username}
            </div>
          )}
          <InputPair
            id="email"
            label="Email"
            description="Enter your email"
            name="email"
            required
            placeholder="i.e wemake@example.com"
          />
          {actionData && "formErrors" in actionData && (
            <div className="text-red-500">{actionData.formErrors?.email}</div>
          )}
          <InputPair
            id="password"
            label="Password"
            description="Enter your password"
            name="password"
            required
            placeholder="i.e *********"
          />
          {actionData && "formErrors" in actionData && (
            <div className="text-red-500">
              {actionData.formErrors?.password}
            </div>
          )}
          {/* InputPair를 만들었던 것처럼 폼 전용으로 쓸 Button 이 있으면 좋다 (#7.5) 
          실제 올바른 데이터를 넣어도 로그인 안되는데, 이는 supabase -> authentication -> sign in/up -> auth providers -> email 경로에서
          컨펌이메일을 꺼야 로그인 처리가 됨. confirm email이라는 건 사용자가 첫번째 로그인 하기 전에 이메일을 확인해야 한다는 뜻이다.
          */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <LoaderIcon className="animate-spin" /> : "Sign up"}
          </Button>
          {actionData && "signUpError" in actionData && (
            <p className="text-red-500">{actionData.signUpError}</p>
          )}
        </Form>
      </div>
      <AuthButtons />
    </div>
  );
}
