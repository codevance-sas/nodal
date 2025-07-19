"use client"

import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  children: React.ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { isOpen } = useSidebarStore();
  const isMobile = useIsMobile();

  return (
    <main 
      className={cn(
        "pt-16 transition-all duration-300 ease-apple h-[100%]",
        !isMobile && isOpen ? "pl-[20rem]" : "pl-0"
      )}
    >
      <div className="p-4 md:p-6 min-h-[calc(100vh-4rem)]">
        {children}
      </div>
    </main>
  );
} 