import { PageHeader } from "~/common/components/page-header";
import type { Route } from "./+types/team-page";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { Form } from "react-router";
import { InputPair } from "~/common/components/input-pair";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/common/components/ui/card";
import { getTeamById } from "../queries";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId } from "~/features/users/queries";

export const meta: Route.MetaFunction = () => [
  { title: "Team Details | wemake" },
];

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  await getLoggedInUserId(client);
  const team = await getTeamById(client, Number(params.teamId));
  return { team };
};

export default function TeamPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <PageHeader
        title={`Join ${loaderData.team.team_leader.username}'s team`}
      />
      <div className="grid grid-cols-6 gap-40 items-start">
        <div className="col-span-4 grid grid-cols-4 gap-5">
          {[
            {
              title: "Product name",
              value: loaderData.team.product_name,
            },
            {
              title: "Stage",
              value: loaderData.team.product_stage,
            },
            {
              title: "Team size",
              value: loaderData.team.team_size,
            },
            {
              title: "Available equity",
              value: loaderData.team.equity_split,
            },
          ].map((item) => (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <CardContent className="p-0 font-bold text-2xl capitalize">
                  <p className="text-lg font-medium">{item.value}</p>
                </CardContent>
              </CardHeader>
            </Card>
          ))}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Looking for
              </CardTitle>
              <CardContent className="p-0 font-bold text-2xl">
                <ul className="text-lg list-disc list-inside">
                  {loaderData.team.roles.split(",").map((item: string) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </CardHeader>
          </Card>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Idea description
              </CardTitle>
              <CardContent className="p-0 font-bold text-xl">
                <p className="text-lg font-medium p-0">
                  {loaderData.team.product_description}
                </p>
              </CardContent>
            </CardHeader>
          </Card>
        </div>
        <aside className="col-span-2 border rounded-lg shadow-sm p-6 space-y-4">
          {/* 왼쪽에는 Avatar, 오른쪽에는 사용자가 있는 component 만들기 */}
          <div className="flex gap-5">
            {/* gap이랑 space-x 차이점 : space x,y는 그냥 margin을 넣는 거고 gap은
          flex container 내부에서 동작하는 property */}
            <Avatar className="size-14">
              {loaderData.team.team_leader.avatar && (
                <AvatarImage src={loaderData.team.team_leader.avatar} />
              )}
              <AvatarFallback>
                {loaderData.team.team_leader.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-medium">
                {loaderData.team.team_leader.username}
              </h4>
              <Badge variant="secondary" className="capitalize">
                {loaderData.team.team_leader.role}
              </Badge>
            </div>
          </div>
          <Form
            method="post"
            className="space-y-5"
            action={`/users/${loaderData.team.team_leader.username}/messages`}
          >
            <InputPair
              description="Tell us about yourself"
              label="Introduce yourself"
              name="content"
              type="text"
              id="content"
              required
              textArea
              placeholder="i.e. I'm a software engineer with a passion for building scalable and efficient systems."
            />
            <Button className="w-full">Get in touch</Button>
          </Form>
        </aside>
      </div>
    </div>
  );
}
