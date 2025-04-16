-- chat 에 작성하는 내용
-- @migrations Use this migration files to get the context you need to generate a seed.sql file 
-- to seed each table in the database. For 'profile_id' column this value '1f75d123-89ab-4215-aab6-a48e1cf2f79a', 
-- respect composite primary keys, unique values so on. Create at least 5 rows per table if possible, 
-- 1 row per table that contains a composite primary key.
-- Do not seed 'profile' use '1f75d123-89ab-4215-aab6-a48e1cf2f79a' for 'profile_id' everywhere

-- @migrations
-- 이 마이그레이션 파일들을 사용하여 데이터베이스 내 모든 테이블에 데이터를 삽입할 seed.sql 파일을 생성하는 데 
-- 필요한 컨텍스트를 수집하세요. `profile_id` 컬럼에는 `f1de9100-c248-4425-8c06-f8b0de2bb8ae` 값을 사용하고, 
-- 복합 기본 키, 유니크 제약조건 및 기타 관련 제약조건을 준수하세요. 
-- 단, `profiles` 테이블은 제외합니다. 
-- 가능하면 각 테이블에 최소 5개의 행을 생성하고, 복합 기본 키를 가진 브릿지 테이블에는 1개의 행을 생성하세요.

-- 이후 supabase SQL Editor에서 create new snippet 클릭한 다음에 

-- 먼저 function을 만들고 auth users 테이블에 trigger를 만들어야 함. trigger는 길어질거지만, 여기서는 admin 패널에서 새로운 유저가 추가되는 이벤트 처리함
-- 아래 작성한 것을 supabase sql 편집기에서 create new snippet 클릭한 다음에 붙여넣되, 중요한 점은 'run'을 바로 클릭하진 않기 하나씩 하이라이트해서 실행
-- 
drop function if exists public.handle_new_user() CASCADE;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer 
set search_path = ''
as $$
begin
    -- create a anonymous profile for the user
    -- 이런 trigger를 만들면 삽입되고 있는 행에 new 키워드를 사용해서 접근할 수 있음
    -- raw_app_meta_data 가 필요함. 신중하게 하는 이유는 trigger에 에러가 있으면 유저가 계정을 만들 수 없기 때문이다.
    if new.raw_app_meta_data is not null then
        -- 이렇게 하면 PostgreSQL의 JSONB 필드에서 JSON 데이터를 추출할 수 있음
        if new.raw_app_meta_data ? 'provider' and new.raw_app_meta_data ->> 'provider' = 'email' OR 
        -- sms 추가(#7.10) 전화번호는 이메일과 사용자 이름(username)에 추가로 설정하는게 더 적합하다고 생각됨(니콜라스)
        new.raw_app_meta_data ->> 'provider' = 'phone' then
            -- 실제 입력한 데이터가 프로필에 들어가기 위해서 조건문을 추가함(#7.6)
            -- 코드챌린지 : 회원가입 때 role을 추가해서 설정할 수 있도록(아래는 developer로 기본값 설정시킴)
            if new.raw_app_meta_data ? 'name' and new.raw_user_meta_data ? 'username' then
                insert into public.profiles (profile_id, name, username, role)
                -- ? 연산자 : JSON 객체에 특정 키가 있는지 알려준다.
                -- >> 연산자 : JSON 객체에서 특정 키의 값을 추출한다.
                values (new.id, new.raw_app_meta_data ->> 'name', new.raw_user_meta_data ->> 'username', 'developer');
            else 
                insert into public.profiles (profile_id, name, username, role)
                -- username은 고유해야함. profile_id를 user_id와 동일하게 설정하고 싶음
                values (new.id, 'Anonymous', 'mr.' || substr(md5(random()::text), 1, 8), 'developer');
            end if;
        end if;
        -- #7.8 소셜 로그인 추가시 프로필 업데이트 쿼리(카카오) 다만, 이메일로 유저네임이 같으면 에러가 발생할거다. 
        -- 방법 : 유저의 선호하는 유저이름 같은걸 사용하고, 아마 뒤에 임의의 숫자를 추가할 수 있다. 또는 프로필 만들기 전에 저장하려는 그 유저 이름으로 기존 이름이 있는지 확인
        if new.raw_app_meta_data ? 'provider' and new.raw_app_meta_data ->> 'provider' = 'kakao' then
            insert into public.profiles (profile_id, name, username, role, avatar)
            -- 유저이름을 가진 유저가 있을 경우 대비해서 고유하게 만듦
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'preferred_username' || substr(md5(random()::text), 1, 5), 'developer', new.raw_user_meta_data ->> 'avatar_url');
        end if;
        -- #7.8 소셜 로그인 추가시 프로필 업데이트 쿼리(깃헙)
        if new.raw_app_meta_data ? 'provider' and new.raw_app_meta_data ->> 'provider' = 'github' then
            insert into public.profiles (profile_id, name, username, role, avatar)
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'user_name' || substr(md5(random()::text), 1, 5), 'developer', new.raw_user_meta_data ->> 'avatar_url');
        end if;
    end if;
    --이건 trigger 니까 항상 return new 해야함
    return new;
end
$$;

-- trigger를 실행할 코드를 작성. auth 테이블에 새로운 유저가 추가될 때마다 실행되도록. 위 함수 호출
create trigger user_to_profile_trigger
after insert on auth.users
for each row execute function public.handle_new_user();