-- #6.8 Product Overview 
-- 1. view 작성 및 supabase SQL Editor에서 실행
-- 2. 새로운 view 생성 후 npm run db:typegen
-- 3. 이제 queries.ts에서 이 view 이름으로 select 할 수 있음
CREATE OR REPLACE VIEW product_overview_view AS
SELECT
    product_id,
    name,
    tagline,
    description,
    how_it_works,
    icon,
    url,
    -- json 안에 있는 field라 '' 감싸줌
    stats->>'upvotes' as upvotes,
    stats->>'views' as views,
    stats->>'reviews' as reviews,
    AVG(product_reviews.rating) as average_rating
FROM public.products
LEFT JOIN public.reviews AS product_reviews USING (product_id)
GROUP BY product_id;
