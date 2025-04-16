/* #6.14 SQL Editor에서 functions라는 새로운 폴더를 만듦 > sql editor에서 function 돌려보고 잘돌아가면 npm run db:typegen
아래 예시는 연습을 위한 예시로 바보같은 예시임*/
create or replace function track_event(
-- argument, type
  event_type event_type,
  event_data jsonb
) returns void as $$
begin
    insert into events (event_type, event_data) values (event_type, event_data);
end;
$$ language plpgsql;

-- 니콜라스가 만들었던 기능 중엔 유저가 계정을 삭제해주는 게 있었음 그런 기능을 가진 SQL Function 을 만들 수 있다.
-- 자바스크립트의 supabase 클라이언트를 사용해서 여러 쿼리를 하나하나 호출하는 대신에, 하고 싶은 기능을 모두 모아 하나의 function 만들어서 하나만 호출하면 됨
-- 이건 삭제하고, 이건 Null로 설정하고, 이메일 전송하고 등
