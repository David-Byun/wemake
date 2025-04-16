import { FlickeringGrid } from "components/magicui/flickering-grid";
import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    // auth 는 레이아웃 다르게 가져감
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
      {/* 모바일에서는 hidden이고, 큰 화면에서는 display:block 으로 설정 sm, md, lg, xl, 2xl
      https://magicui.design/
      */}
      <div>
        <FlickeringGrid
          squareSize={4}
          gridGap={5}
          maxOpacity={0.5}
          flickerChance={0.2}
          color="hsl(var(--primary))"
        />
      </div>
      <Outlet />
    </div>
  );
}
