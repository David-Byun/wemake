import { PageHeader } from "~/common/components/page-header";

import { Form, redirect } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import SelectPair from "~/common/components/select-pair";
import { Button } from "~/common/components/ui/button";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";
import { getTopics } from "../queries";
import type { Route } from "./+types/submit-post-page";
import { z } from "zod";
import { createPost } from "../mutations";

//loader와 action은 로그인된 사람만 할 수 있도록 userId 가져와야함(#8.0)
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  await getLoggedInUserId(client);
  const topics = await getTopics(client);
  return { topics };
};

const formSchema = z.object({
  title: z.string().min(1).max(40),
  content: z.string().min(1).max(1000),
  category: z.string().min(1),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  //parse가 있으면 에러를 던진다. safeParse는 에러를 던지지 않고 성공 여부를 알려줌
  const { success, error, data } = formSchema.safeParse(
    Object.fromEntries(formData)
  );
  if (!success) {
    return {
      fieldErrors: error.flatten().fieldErrors,
    };
  }
  const { title, content, category } = data;
  const { post_id } = await createPost(client, {
    title,
    content,
    category,
    userId: userId,
  });
  return redirect(`/community/${post_id}`);
};

export default function SubmitPostPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <div className="container py-8">
      <PageHeader title="Submit Post" subtitle="Submit a new post" />
      <Form className="space-y-10 max-w-screen-md mx-auto" method="post">
        <InputPair
          label="Title"
          name="title"
          id="title"
          description="(40 characters or less)"
          required
          placeholder="i.e. What is the best way to learn programming?"
        />
        {actionData && "fieldErrors" in actionData && (
          <div className="text-red-500">
            {actionData.fieldErrors?.title?.join(", ")}
          </div>
        )}
        <SelectPair
          required
          name="category"
          label="Category"
          placeholder="Select a category"
          description="Choose a category for your post"
          options={loaderData.topics.map((topic) => ({
            label: topic.topic,
            value: topic.slug,
          }))}
        />
        {actionData && "fieldErrors" in actionData && (
          <div className="text-red-500">
            {actionData.fieldErrors?.category?.join(", ")}
          </div>
        )}
        <InputPair
          label="Content"
          name="content"
          id="content"
          description="(1000 characters or less)"
          required
          placeholder="i.e. What is the best way to learn programming?"
          textArea
        />
        {actionData && "fieldErrors" in actionData && (
          <div className="text-red-500">
            {actionData.fieldErrors?.content?.join(", ")}
          </div>
        )}
        <Button type="submit" className="w-full">
          Create Discussion
        </Button>
      </Form>
    </div>
  );
}

export function meta({}: Route.MetaFunction) {
  return [
    {
      title: "Submit Post",
      description: "Create a new community post",
    },
  ];
}
