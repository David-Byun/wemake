import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/teams-page";
import { TeamCard } from "../components/team-card";
import { getTeams } from "../queries";
import { makeSSRClient } from "~/supa-client";
export const meta: Route.MetaFunction = () => [{ title: "Teams | wemake" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const teams = await getTeams(client, { limit: 11 });
  return { teams };
};

export function action({}: Route.ActionArgs) {
  return {};
}

export default function TeamsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <PageHeader title="Teams" subtitle="Create and manage your teams" />
      {/* cursor 할때 파일을 열어두는게 좋은 이유는 다른 파일의 내용을 기초해서 우리가 무엇을 하려는지 알 수 있음 */}
      <div className="grid grid-cols-4 gap-4">
        {loaderData.teams.map((team) => (
          <TeamCard
            id={team.team_id}
            leaderName={team.team_leader.username}
            leaderAvatarUrl={team.team_leader.avatar}
            positions={team.roles.split(",")}
            projectDescription={team.product_description}
            key={team.team_id}
          />
        ))}
      </div>
    </div>
  );
}
