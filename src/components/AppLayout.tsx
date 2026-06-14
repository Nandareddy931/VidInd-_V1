import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        {/* pb-28 on mobile for BottomNav, pb-6 on tablet+; px scales with screen */}
        <main className="flex-1 px-3 sm:px-4 md:px-5 lg:px-8 py-4 lg:py-5 pb-28 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
