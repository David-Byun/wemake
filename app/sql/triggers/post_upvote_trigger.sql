CREATE FUNCTION public.handle_post_upvote() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
-- function을 만들 때 그것을 trigger로 바꿀 때 NEW라는 키워드로 새로 생성된 row에 접근할 수 있다.
BEGIN 
-- 많은 schema를 가지고 있어서 어떤 schema를 UPDATE할 것인지 말해야해
    UPDATE public.posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER post_upvote_trigger
AFTER INSERT ON public.post_upvotes
FOR EACH ROW EXECUTE FUNCTION public.handle_post_upvote();

CREATE FUNCTION public.handle_post_unvote() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN 
--우리에겐 NEW가 없고 OLD가 있어
    UPDATE public.posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER post_unvote_trigger
AFTER DELETE ON public.post_upvotes
FOR EACH ROW EXECUTE FUNCTION public.handle_post_unvote();