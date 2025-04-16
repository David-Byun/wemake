// drizzle kit이 이 파일에서 설정 옵션을 가져옴
import { defineConfig } from "drizzle-kit";

/* 
    다시 말하지만 이 파일은 drizzle kit이 설정 정보를 확인할 때 사용
    schema를 하나의 파일에 다 적어도 되지만 divide and conquer 철학에 따라 파일을 나눔
    package.json에 있는 데이터베이스 관련 명령어 추가
    "db:generate": "drizzle-kit generate", : 스키마 파일을 확인해서 변경된 사항이 있는지 감지 후 데이터베이스를 수정할 SQL 파일 생성
    "db:migrate": "drizzle-kit migrate", : 파일을 가져와서 실제로 데이터베이스에 적용
    "db:studio": "drizzle-kit studio"
*/
export default defineConfig({
  schema: "./app/features/**/schema.ts",
  // seed를 위해서 migrations 폴더를 sql 폴더에 넣었기 때문에 out : ./app/sql/migrations 로 설정
  out: "./app/sql/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
