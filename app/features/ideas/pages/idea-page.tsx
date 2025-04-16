import { DotIcon, EyeIcon, HeartIcon } from "lucide-react";
import { PageHeader } from "~/common/components/page-header";
import { Button } from "~/common/components/ui/button";
import type { Route } from "./+types/idea-page";
import { getGptIdea } from "../queries";
import { DateTime } from "luxon";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";
import { Form, redirect } from "react-router";
import { claimIdea } from "../mutations";

interface Idea {
  id: number;
  title: string;
  description: string;
  votes: number;
  createdAt: string;
}

/* #6.3 loader가 어떤 data를 return 하면 meta 내부에서 그 data를 전달받을 수 있음 
typescript와 react router는 멋있어서 저 타입들을 자동으로 생성해준다.*/
export const meta = ({
  data: {
    idea: { gpt_idea_id, idea },
  },
}: Route.MetaArgs) => {
  return [
    { title: `IdeasGPT #${gpt_idea_id} : ${idea}| wemake` },
    { name: "description", content: "Find ideas for your next project" },
  ];
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const idea = await getGptIdea(client, { ideaId: params.ideaId });
  if (idea.is_claimed) {
    throw redirect(`/ideas`);
  }
  return { idea };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const idea = await getGptIdea(client, { ideaId: params.ideaId });
  //return시 typescript에서 오류 발생해서 throw로 수정(#8.5)
  if (idea.is_claimed) {
    return { ok: false };
  }
  await claimIdea(client, { ideaId: params.ideaId, userId });
  return redirect(`/my/dashboard/ideas`);
};

export default function IdeaPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PageHeader
        title={loaderData.idea.gpt_idea_id.toString()}
        subtitle="Find idea for your next project"
      />
      <div className="max-w-screen-sm mx-auto flex flex-col items-center gap-10">
        <p className="italic text-center">{loaderData.idea.idea}</p>
        <div className="flex items-center text-sm">
          <div className="flex items-center gap-1">
            <EyeIcon className="size-4" />
            <span>{loaderData.idea.views}</span>
          </div>
          <DotIcon className="size-4" />
          <span>
            {DateTime.fromISO(loaderData.idea.created_at).toRelative()}
          </span>
          <DotIcon className="size-4" />
          <Button variant="outline">
            <HeartIcon className="size-4" />
            <span>{loaderData.idea.likes}</span>
          </Button>
        </div>
        {loaderData.idea.is_claimed ? null : (
          // 버튼 클릭하면 action이 호출 됨
          <Form method="post">
            <Button size="lg">Claim idea now &rarr;</Button>
          </Form>
        )}
      </div>
    </div>
  );
}
