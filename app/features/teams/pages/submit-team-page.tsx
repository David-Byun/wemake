import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/submit-team-page";
import { Button } from "~/common/components/ui/button";
import { Form, redirect } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import SelectPair from "~/common/components/select-pair";
import { PRODUCT_STAGE } from "../constants";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";
import { z } from "zod";
import { createTeam } from "../mutations";

export const meta: Route.MetaFunction = () => [{ title: "Submit Team" }];

//로그인된 유저인지 get 확인
export async function loader({ request }: Route.LoaderArgs) {
  const { client } = makeSSRClient(request);
  await getLoggedInUserId(client);
}

export const formSchema = z.object({
  name: z.string().min(1).max(20),
  stage: z.string().min(1).max(20),
  //form으로 넘어올때는 string으로 넘어오기 때문에 number 변환하기 위해서 coerce 사용
  size: z.coerce.number().min(1).max(100),
  equity: z.coerce.number().min(1).max(100),
  roles: z.string().min(1).max(200),
  description: z.string().min(1).max(200),
});

//로그인된 유저인지 post 확인
export async function action({ request }: Route.ActionArgs) {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const { success, data, error } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return {
      fieldErrors: error.flatten().fieldErrors,
    };
  }
  //mutation.ts 참고
  const { team_id } = await createTeam(client, userId, { ...data });
  //모든 항목이 name을 가지고 있는지 꼭 확인!
  return redirect(`/teams/${team_id}`);
}

export default function SubmitTeamPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <PageHeader title="Submit Team" subtitle="Create a team" />
      <Form
        method="post"
        className="max-w-screen-2xl flex flex-col mx-auto items-center space-y-10 w-full"
      >
        <div className="grid grid-cols-3 gap-10 w-full">
          <InputPair
            label="What is the name of your team"
            placeholder="e.g. Team Name"
            description="(20 characters or less)"
            name="name"
            maxLength={20}
            type="text"
            id="name"
            required
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.name?.join(", ")}
            </div>
          )}
          <SelectPair
            label="What is the stage of your product"
            description="(20 characters or less)"
            placeholder="Select a stage"
            name="stage"
            required
            // 이걸 분리해서 별도의 constant를 만들 것이다.
            options={PRODUCT_STAGE}
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.stage?.join(", ")}
            </div>
          )}
          <InputPair
            label="What is the size of your team"
            description="(1-100)"
            name="size"
            type="number"
            id="size"
            required
            max={100}
            min={1}
            placeholder="e.g. 10"
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.size?.join(", ")}
            </div>
          )}
          <InputPair
            label="How much equity are you willing to give away?"
            description="(1-100)"
            placeholder="e.g. 10"
            name="equity"
            type="number"
            id="equity"
            required
            max={100}
            min={1}
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.equity?.join(", ")}
            </div>
          )}
          <InputPair
            label="What roles are you looking for?"
            description="(comma separated)"
            placeholder="e.g. Designer, Developer, etc."
            name="roles"
            type="text"
            id="roles"
            required
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.roles?.join(", ")}
            </div>
          )}
          <InputPair
            label="What is the description of your product"
            description="(200 characters or less)"
            name="description"
            placeholder="e.g. We are a team of 10 people who are building a product that helps people to manage their time."
            maxLength={200}
            type="text"
            id="description"
            required
            textArea
          />
          {actionData && "fieldErrors" in actionData && (
            <div className="text-red-500">
              {actionData.fieldErrors?.description?.join(", ")}
            </div>
          )}
        </div>
        <Button type="submit" className="w-full max-w-sm" size="lg">
          Create Team
        </Button>
      </Form>
    </div>
  );
}
