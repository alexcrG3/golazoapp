import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { isOpen, close } = useSidebar();

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md">
      {/* Ambient atmospheric glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-[-80px] h-[300px] w-[300px] rounded-full bg-[oklch(0.6_0.22_260/0.18)] blur-[100px]" />
      </div>
      <main className="pb-32">{children}</main>
      <BottomNav />
      <Sidebar isOpen={isOpen} onClose={close} />
    </div>
  );
}
