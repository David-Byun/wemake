-- Follow user trigger가 생성되는 시점은 누군가가 나를 follow 할 때다
-- Follow user
CREATE FUNCTION public.notify_follow()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
LANGUAGE plpgsql
AS $$
-- trigger를 만들 때 방금 막 새로 생긴 NEW 키워드로 된 row에 접근 가능
BEGIN
    INSERT INTO public.notifications (
        type,
        source_id,
        target_id,   
    )
    VALUES (
        'follow',
        NEW.follower_id,
        NEW.following_id,
    );
    RETURN NEW;  -- 여기에 RETURN NEW를 꼭 넣어줘야함
END;
$$;

CREATE TRIGGER notify_follow_trigger
AFTER INSERT ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.notify_follow();

DROP FUNCTION public.notify_review() CASCADE;
DROP FUNCTION public.notify_reply() CASCADE;


-- Review Product는 누군가 내 product에 review를 남겼을 때
-- Review Product
CREATE FUNCTION public.notify_review()  -- 공개 스키마에 notify_review 함수 생성
RETURNS TRIGGER                         -- 트리거 함수임을 명시
SECURITY DEFINER                       -- 함수 소유자의 권한으로 실행
SET search_path = ''                   -- 보안을 위해 검색 경로를 비움
LANGUAGE plpgsql                       -- PL/pgSQL 언어 사용
AS $$
DECLARE 
  product_owner uuid;
BEGIN
  -- 여기에 트리거 로직이 들어갈 예정
  -- 이게 바로 value를 variable에 저장하는 방법
  SELECT profile_id INTO product_owner FROM public.products
  WHERE product_id = NEW.product_id;
  INSERT INTO public.notifications (
        type,
        source_id,
        target_id,   
        product_id
    )
    VALUES (
        'review',
        NEW.profile_id,
        product_owner, -- 테이블에 product_id, profile_id만 있고 product owner 정보가 없으므로 변수로 설정
        NEW.product_id
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_review_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_review();

-- Reply to post는 누군가 내 post에 답글을 남겼을 때
CREATE FUNCTION public.notify_reply()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE 
  post_owner uuid;
BEGIN
    SELECT profile_id INTO post_owner FROM public.posts
    WHERE post_id = NEW.post_id;
    INSERT INTO public.notifications (
        type,
        source_id,
        target_id,   
        post_id
    )
    -- new는 reply를 의미하며, review가 product_id를 가지고 있는 것 처럼 reply는 post_id를 가지고 있음
    VALUES (
        'reply',
        NEW.profile_id,
        post_owner,
        NEW.post_id
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_reply_trigger
AFTER INSERT ON public.post_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_reply();