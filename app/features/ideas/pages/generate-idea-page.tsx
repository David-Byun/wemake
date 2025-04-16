import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { Route } from "./+types/generate-idea-page";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.GEMINI_BASE_URL,
});

//아래같은 형식으로 아이디어을 반환해줌
//너가 원한다면 모델이 생성한 아이디어를 검증할 수도 있어(할루시네이션 방지)
//다른 모델에 물어봐서 응답값에 대해 점수를 부여해서 검증할 수도 있어(AI를 사용해서 AI의 출력을 검증)
const IdeaSchema = z.object({
  title: z.string(),
  description: z.string({
    description: "A short description of the idea. 10 characters or less",
  }),
  link: z.string().url(),
  problem: z.string(),
  solution: z.string(),
  category: z.enum([
    "AI",
    "SaaS",
    "E-commerce",
    "Marketing",
    "Education",
    "Healthcare",
    "Finance",
    "Other",
  ]),
});

const ResponseSchema = z.object({
  ideas: z.array(IdeaSchema).length(10),
});

//#11.2 cron 설정하면서 loader 대신 action 사용. 우리는 이 URL을 공개하지 않을 거지만, 그럼에도 반드시 이 endpoint를 보호해야 해
export const action = async ({ request }: Route.ActionArgs) => {
  //1. 누군가가 해킹을 시도하고 있다면 우리는 이렇게 응답
  //2. supabase 프로젝트 설정 > API > HTTP Headers 새로운 헤더를 추가. 이 헤더가 포함된 요청만 통과. 헤더 이름과 값은 원하는대로 설정할 수 있지만 보안에 신경
  if (request.method !== "POST") {
    return new Response(null, { status: 404 });
  }
  const header = request.headers.get("X-POTATO");
  //여기서 중요한 점 : 헤더의 이름과 값 모두 철저히 확인해야 한다.
  /* localhost라 테스트가 어려워서  https://github.com/cloudflare/cloudflared 프로그램을 이용.
  이 프로그램은 아주 작은 프로그램이지만, localhost를 임시로 외부에 노출시키는데 사용할 수 있다.
  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  brew install cloudflared
  winget install --id Cloudflare.cloudflared
  cloudflared tunnel --url http://localhost:5173/  
  생성된 url을 supabase 프로젝트 설정 > API > Endpoint URL에 추가 
  여기서는 Open AI URL로 했지만, SQL 코드로도 크론 작업을 실행할 수 있다.
  - 모든 계정을 삭제하거나, 백업을 만들거나, 메시지를 삭제하거나, 점수를 다시 계산하거나, 업보트(upvotes)를 업데이트하는 작업도 할 수 있음
  ex 1년 이상된 이벤트를 삭제하는 크론 작업 등
  노마드코더에서는 월요일에 알림을 삭제하고 있다.
  */
  if (!header || header !== "X-TOMATO") {
    return new Response(null, { status: 404 });
  }

  const completion = await openai.beta.chat.completions.parse({
    model: "gemini-1.5-flash",
    messages: [
      {
        role: "user",
        content: "Give an idea for a startup that can be built by one person",
      },
    ],
    //"ideas"는 반환된 데이터의 키 이름. 아무거나 설정 가능
    response_format: zodResponseFormat(ResponseSchema, "ideas"),
  });
  //아이디어 테이블에는 description만 포함되어 있어서 description만 반환
  const descriptions = completion.choices[0].message.parsed?.ideas.map(
    (idea) => idea.description
  );
  /* #11.1 여기에서 사용할 Supabase 클라이언트는 우리가 이전에 만들었던 클라이언트와는 다르다. 
  그 이유는 지금까지 모든 테이블에 Row Level Security(RLS)를 활성화했어야 하기 때문이다.
  이는 사용자가 데이터베이스에 아이디어를 삽입할 수 있는 정책(policy)를 만들지 않았다는 걸 의미
  여기서의 client는 관리자 권한을 가진 클라이언트다.
  애플리케이션의 다른 모든 부분에서는 사용자를 위한 클라이언트를 생성했었다.
  사람들에게 권한을 줘서 데이터베이스에 아이디어 삽입하는 거 외에는 사람들이 아이디어를 삽입할 수 없어야 한다.
  supabase 프로젝트 설정 > API 
  */
  if (!descriptions) {
    return Response.json({ error: "No descriptions found" }, { status: 400 });
  }

  return Response.json({ ok: true });
};
