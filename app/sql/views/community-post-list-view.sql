-- 1. 쿼리를 작성한다
-- 2. supabase에서 SQL Editor에 새로운 폳더를 만든다.
-- 3. snippet 을 만들고 실행한다.
CREATE OR REPLACE VIEW community_post_list_view AS
SELECT
  posts.post_id,
  posts.title,
  posts.created_at,
  topics.topic AS topic,
  profiles.username AS author_username,
  profiles.name AS author,
  profiles.avatar AS author_avatar,
  posts.upvotes,
  -- #6.2 topics slug 추가. 맨 마지막에 추가한 이유 : 일단 view를 만든 뒤라면 새로운 column은 뒤쪽에 추가하는게 더 낫다.
  -- npm run db:typegen 
  topics.slug as topics_slug,
  (SELECT 1 FROM public.post_upvotes WHERE post_upvotes.post_id = posts.post_id 
    AND post_upvotes.profile_id = auth.uid())) AS is_upvoted
FROM posts
INNER JOIN topics USING (topic_id)
INNER JOIN profiles USING (profile_id);