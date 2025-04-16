import { PageHeader } from "~/common/components/page-header";
import { IdeaCard } from "../components/idea-card";
import { getGptIdeas } from "../queries";
import type { Route } from "./+types/ideas-page";
import { makeSSRClient } from "~/supa-client";

/* #6.3
GPT 페이지에서 view를 만드는 이유는 data에 변형이 약간 필요하기 때문인데, 모든 idea들이 가지고 있는 likes를 더하기 위함
나는 relationship을 count 하는 등의 작업을 SQL로 하는 것을 선호해.
join 하는 방법도 보여줬지만, view를 사용해서 data를 다듬고 더하는 방식을 더 선호함
*/
interface Idea {
  id: string;
  title: string;
  description: string;
  votes: number;
  createdAt: string;
}

export const meta = () => {
  return [
    { title: "IdeasGPT | wemake" },
    { name: "description", content: "Find ideas for your next project" },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const ideas = await getGptIdeas(client, { limit: 20 });
  return { ideas };
};

export default function IdeasPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <PageHeader
        title="IdeasGPT"
        subtitle="Find ideas for your next project"
      />
      <div className="grid grid-cols-4 gap-4">
        {loaderData.ideas.map((idea) => (
          <IdeaCard
            id={idea.gpt_idea_id.toString()}
            title={idea.idea}
            key={idea.gpt_idea_id}
            claimed={idea.is_claimed}
          />
        ))}
      </div>
    </div>
  );
}
