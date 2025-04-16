import { MessageCircleIcon } from "lucide-react";

/* shadcn 사이드바 컴포넌트 사용
npx shadcn@latest add sidebar
1) 메시지 목록을 보여주기 위한 용도

*/
export default function MessagesPage() {
  return (
    <div className="h-full flex items-center justify-center w-full flex-col">
      <MessageCircleIcon className="size-12" />
      <h1 className="text-xl font-bold text-muted-foreground">
        사이드바를 눌러서 메시지를 확인해 보세요
      </h1>
    </div>
  );
}
