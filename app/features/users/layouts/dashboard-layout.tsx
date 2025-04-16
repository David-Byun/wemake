import { HomeIcon, RocketIcon } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/common/components/ui/sidebar";
import { makeSSRClient } from "~/supa-client";
import { getLoggedInUserId, getProductsByUserId } from "../queries";
import type { Route } from "./+types/dashboard-layout";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { client } = makeSSRClient(request);
  const userId = await getLoggedInUserId(client);
  const products = await getProductsByUserId(client, { userId });
  return { products, userId };
};

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  return (
    <SidebarProvider className="overflow-hidden min-h-full">
      {/* 조금 내리기 위해서 padding top 줌 */}
      <Sidebar variant="floating" className="pt-16" side="left">
        <SidebarContent className="pr-5">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                {/* SidebarMenuButton은 SidebarMenuItem 안에 있어야 함 */}
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/my/dashboard"}
                >
                  <Link to="/my/dashboard">
                    <HomeIcon className="size-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {loaderData.products.map((product) => (
                <SidebarMenuItem key={product.product_id}>
                  {/* active가 되면 약간의 bold 효과가 들어감 */}
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname ===
                      `/my/dashboard/products/${product.product_id}`
                    }
                  >
                    <Link to={`/my/dashboard/products/${product.product_id}`}>
                      <RocketIcon className="size-4" />
                      <span>{product.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Product Analytics</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/my/dashboard/products/1">
                    <RocketIcon className="size-4" />
                    <span>Product 1</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="ml-50 w-full h-full">
        {/* route에 따라 달라지는 부분이 사이드바 옆에 표시됨 */}
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
