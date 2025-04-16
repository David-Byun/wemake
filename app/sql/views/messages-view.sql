CREATE OR REPLACE VIEW messages_view AS
-- 메시지 사이드바 채우기 위한 쿼리. 
-- 1. 현재 user가 접속 중인 모든 room에서 message_room_id를 가져온다.
SELECT 
    m1.message_room_id, 
    profiles.name,
    ( 
        SELECT content 
        FROM messages 
        WHERE message_room_id = m1.message_room_id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) AS last_message,
    m1.profile_id AS profile_id,
    m2.profile_id AS other_profile_id,
    profiles.avatar
FROM message_room_members m1
INNER JOIN message_room_members m2 ON m1.message_room_id = m2.message_room_id
INNER JOIN profiles on profiles.profile_id = m2.profile_id;
-- view 만든 다음에 supa-client에서 view를 override 해줘야 한다.(null이 될 수 없게 처리)
-- 내 이름이 보이는 채팅방은 안보이게
-- WHERE m1.profile_id = '473ca5f2-858e-468a-8096-706058be8cf1'
-- AND m2.profile_id != '473ca5f2-858e-468a-8096-706058be8cf1';
    


