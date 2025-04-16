import { Link, type MetaFunction } from "react-router";
import { Button } from "~/common/components/ui/button";
import { ProductCard } from "~/features/products/components/product-card";
import { PostCard } from "~/features/community/components/post-card";
import { IdeaCard } from "~/features/ideas/components/idea-card";
import { JobCard } from "~/features/jobs/components/job-card";
import { TeamCard } from "~/features/teams/components/team-card";
import type { Route } from "./+types/home-page";
import { getProductsByDateRange } from "~/features/products/queries";
import { DateTime } from "luxon";
import { getPosts } from "~/features/community/queries";
import { getGptIdeas } from "~/features/ideas/queries";
import { getJobs } from "~/features/jobs/queries";
import { getTeams } from "~/features/teams/queries";
import { makeSSRClient } from "~/supa-client";

export const meta: MetaFunction = () => {
  return [
    { title: "Home | wemake" },
    { name: "description", content: "Welcome to wemake" },
  ];
};

/*
loader로 서버사이드에서 데이터를 불러오기 때문에 안전함
데이터를 useEffect 로 부르고 UI 그리고 로딩바 하는 작업등을 안해도됨
UI 보이기 전에 실행됨
*/
/* #7.2 서버사이드 렌더링으로 하려면 loader 함수를 사용*/
export const loader = async ({ request }: Route.LoaderArgs) => {
  //#7.2 추가. 클라이언트를 받았다면, 여기 있는 모든 함수들에게 클라이언트를 전달해줄 수 있음. 모든 함수 리팩토링 이후 npm run typecheck
  const { client, headers } = makeSSRClient(request);
  const products = await getProductsByDateRange(client, {
    startDate: DateTime.now().startOf("day"),
    endDate: DateTime.now().endOf("day"),
    limit: 7,
  });
  const posts = await getPosts(client, {
    limit: 7,
    sorting: "newest",
  });
  const ideas = await getGptIdeas(client, { limit: 7 });
  const jobs = await getJobs(client, { limit: 11 });
  const teams = await getTeams(client, { limit: 11 });
  return { products, posts, ideas, jobs, teams };
  // const headers = new Headers();
  // headers.set("Set-Cookie", "test=123");
  // //꼭 기억해 data 함수는 loader 함수의 정보를 리턴할 수 있지만, 헤더나 상태코드 등 추가적인 정보들을 포함해서 리턴할 수 있도록 해준다.
  // return data(
  //   {
  //     products: [],
  //     posts: [],
  //     ideas: [],
  //     jobs: [],
  //     teams: [],
  //   },
  //   {
  //     headers,
  //   }
  // );
};

/* 최신버전의 react router framework에서는 우리를 위해 type을 만들어줌
경로를 생성할때마다 react router가 특정한 타입들을 생성해줌*/
export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="px-20 space-y-40">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Today's Products
          </h2>
          <p className="text-xl font-light text-foreground">
            The best products made by our community today.
          </p>
          <Button variant="link" className="text-lg p-0" asChild>
            <Link to="/products/leaderboards">Explore all products &rarr;</Link>
          </Button>
        </div>
        {loaderData.products.map((product: any) => (
          <ProductCard
            id={product.product_id.toString()}
            name={product.name}
            description={product.tagline}
            upvotes={product.upvotes}
            views={product.views}
            comments={product.reviews}
            key={product.product_id}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Latest Discussions
          </h2>
          <p className="text-xl font-light text-foreground">
            The latest discussions in our community.
          </p>
          <Button variant="link" className="text-lg p-0" asChild>
            <Link to="/community">Explore all discussions &rarr;</Link>
          </Button>
        </div>

        {/* {Array.from({ length: 10 }).map((_, index) => (
          <PostCard
            id={`postId-${index}`}
            title="What is the best way to learn programming?"
            author="Nico"
            category="Productivity"
            createdAt="12 Hours ago"
            authorAvatarUrl="https://github.com/shadcn.png"
            key={index}
          /> */}
        {loaderData.posts.map((post: any) => (
          <PostCard
            id={post.post_id.toString()}
            title={post.title}
            author={post.author}
            category={post.topic}
            createdAt={post.created_at}
            authorAvatarUrl={post.author_avatar}
            key={post.post_id}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Idea GPTs
          </h2>
          <p className="text-xl font-light text-foreground">
            Find ideas for your next project.
          </p>
          <Button variant="link" className="text-lg p-0" asChild>
            <Link to="/idea">Explore all ideas &rarr;</Link>
          </Button>
        </div>
        {loaderData.ideas.map((idea: any) => (
          <IdeaCard
            id={idea.gpt_idea_id.toString()}
            title={idea.idea}
            views={idea.views}
            likes={idea.likes}
            createdAt={idea.created_at}
            claimed={idea.is_claimed}
            key={idea.gpt_idea_id}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Latest Jobs
          </h2>
          <p className="text-xl font-light text-foreground">
            Find your dream job.
          </p>
          <Button variant="link" className="text-lg p-0" asChild>
            <Link to="/jobs">Explore all jobs &rarr;</Link>
          </Button>
        </div>
        {loaderData.jobs.map((job: any) => (
          <JobCard
            id={job.job_id.toString()}
            title={job.position}
            company={job.company_name}
            companyLogoUrl={job.company_logo}
            createdAt={job.created_at}
            type={job.job_type}
            workType={job.location}
            companyHp={job.company_location}
            positionLocation={job.location}
            salary={job.salary_range}
            key={job.job_id}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Find a team mate
          </h2>
          <p className="text-xl font-light text-foreground">
            Join a team looking for a new member.
          </p>
          <Button variant="link" className="text-lg p-0" asChild>
            <Link to="/teams" prefetch="viewport">
              Explore all teams &rarr;
            </Link>
          </Button>
        </div>
        {loaderData.teams.map((team: any) => (
          <TeamCard
            id={team.team_id.toString()}
            leaderName={team.team_leader.username}
            leaderAvatarUrl={team.team_leader.avatar}
            positions={team.roles.split(",")}
            projectDescription={team.product_description}
            /* roles는 콤마로 value가 구분되는 text. split을 사용하면 콤마를 제거하고 array로 바꿔서 반환해줌*/
            key={team.team_id}
          />
        ))}
      </div>
    </div>
  );
}
