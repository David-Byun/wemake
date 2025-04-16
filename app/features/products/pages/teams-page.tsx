import type { MetaFunction } from "react-router";
import { makeSSRClient } from "~/supa-client";
import type { Route } from "./+types/teams-page";
export const meta: MetaFunction = () => {
  return [
    { title: "Teams | Product Hunt Clone" },
    { name: "description", content: "Product teams and makers" },
  ];
};

export function loader({ request }: Route.LoaderArgs) {
  const { client } = makeSSRClient(request);
  return {
    teams: [], // TODO: Add teams data
  };
}

export default function TeamsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Teams</h1>
      {/* Add teams list */}
    </div>
  );
}
