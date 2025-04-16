import { PostCard } from "~/features/community/components/post-card";
import { getUserPosts } from "../queries";
import type { Route } from "./+types/profile-posts-page";
import { makeSSRClient } from "~/supa-client";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const posts = await getUserPosts(client, {
    username: params.username,
  });
  return { posts };
};

export default function ProfilePostsPage({ loaderData }: Route.ComponentProps) {
  return (
    //home-page에서 post-card 컴포넌트 가져오기
    <div className="flex flex-col gap-5">
      {loaderData.posts.map((post) => (
        <PostCard
          id={post.post_id}
          title={post.title}
          author={post.author_username}
          createdAt={post.created_at}
          authorAvatarUrl={post.author_avatar}
          key={post.post_id}
          expanded={true}
          category={post.topic}
        />
      ))}
    </div>
  );
}
