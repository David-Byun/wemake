import { Link, useLocation } from "react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/common/components/ui/avatar";
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from "~/common/components/ui/sidebar";

interface MessageCardProps {
  avatarUrl: string;
  avatarFallback: string;
  name: string;
  lastMessage: string;
  id: string;
}

export function MessageCard({
  avatarUrl,
  avatarFallback,
  name,
  lastMessage,
  id,
}: MessageCardProps) {
  //useLocation은 현재 어떤 경로에 있는지를 알려줌
  const location = useLocation();
  return (
    <SidebarMenuItem>
      {/* SidebarMenuButton에는 isActive와 asChild라는 boolean 타입의 prop이 있음 
      asChild는 부모가 정의한 스타일을 자식에게 그대로 유지시킨다는 의미
      */}
      <SidebarMenuButton
        className="h-18"
        asChild
        isActive={location.pathname === `/my/messages/${id}`}
      >
        <Link to={`/my/messages/${id}`}>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="font-medium text-sm">{name}</p>
              <p className="text-sm text-muted-foreground">{lastMessage}</p>
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
