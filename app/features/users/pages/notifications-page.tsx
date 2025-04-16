import { NotificationCard } from "~/features/users/components/notification-card";
import type { Route } from "./+types/notifications-page";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId, getNotifications } from "../queries";
import { DateTime } from "luxon";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "Notifications | wemake",
    },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const notifications = await getNotifications(client, { userId });
  return { notifications };
};

export default function NotificationsPage({
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <h1 className="text-4xl font-bold">Notifications</h1>
      <div className="flex flex-col items-start gap-5">
        {/* 알림의 확인 여부에 따라 색상을 다르게 보여줌 */}
        {/* abstract this component to /app/features/users/components/notification-card.tsx use props for content */}
        {loaderData.notifications.map((notification) => (
          <NotificationCard
            key={notification.notification_id}
            id={notification.notification_id}
            avatarUrl={notification.source?.avatar ?? ""}
            avatarFallback={notification.source?.name?.[0] ?? ""}
            userName={notification.source?.name ?? ""}
            type={notification.type as "review" | "follow" | "reply"}
            productName={notification.product?.name ?? ""}
            postTitle={notification.post?.title ?? ""}
            payloadId={
              notification.product?.product_id ?? notification.post?.post_id
            }
            timestamp={DateTime.fromISO(notification.created_at).toRelative()!}
            // 읽었는지 안읽었는지 판단
            seen={notification.seen}
          />
        ))}
      </div>
    </div>
  );
}
