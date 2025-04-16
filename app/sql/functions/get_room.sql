-- 1. 두 user 간에 공유되는 message room id를 얻고 싶다.
-- message_room_id를 찾는 이유 : 그들이 같은 room을 공유하는지 궁금하고, 그 room의 id를 알고 싶기 때문이다.
-- message_room_members 테이블을 스스로 join
-- 함수 만들고 supabase에서 함수 실행하고 console로 이동해서 다시 type 생성해야함(npm run db:typegen)

CREATE OR REPLACE FUNCTION public.get_room(from_user_id uuid, to_user_id uuid)
RETURNS TABLE (message_room_id bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
        SELECT m1.message_room_id
            FROM public.message_room_members m1
        INNER JOIN public.message_room_members m2
            ON m1.message_room_id = m2.message_room_id
        WHERE m1.profile_id = from_user_id
            AND m2.profile_id = to_user_id;
END;
$$;
