-- 데이터 변형 view를 project - SQL editor에 반영해준 다음에 typescript에게 우리 애플리케이션의 새로운 view 정보를 알려주기 위해 npm run db:typegen 실행 
CREATE OR REPLACE VIEW gpt_ideas_view AS
SELECT
  gpt_ideas.gpt_idea_id,
  CASE WHEN gpt_ideas.claimed_at IS NULL THEN gpt_ideas.idea 
  ELSE 'ClaimedClaimedClaimedClaimedClaimedClaimedClaimedClaimedClaimedClaimed' END AS idea,
  gpt_ideas.views,
  CASE WHEN gpt_ideas.claimed_at IS NULL THEN false ELSE true END AS is_claimed,
--   relationship을 count해서 likes가 몇개인지 알아봄
  COUNT(gpt_ideas_likes.gpt_idea_id) AS likes,
  gpt_ideas.created_at
FROM public.gpt_ideas
LEFT JOIN public.gpt_ideas_likes USING (gpt_idea_id)
GROUP BY gpt_ideas.gpt_idea_id;
