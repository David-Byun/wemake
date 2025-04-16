// https://orm.drizzle.team/docs/connect-supabase
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/* 
    .env 파일에 데이터베이스 URL 환경변수가 있다는걸 아니까 느낌표! 
    {prepare:false} 하는 이유는 supabase가 connection pooling이라는 기능을 지원하기 때문임
    - 밖에 drizzle.config.ts 라는 파일을 생성 (drizzle kit이 정보를 확인할 때 참조하는 파일) 
*/
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle(client);

export default db;
