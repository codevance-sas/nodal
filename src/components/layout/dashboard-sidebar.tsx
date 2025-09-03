"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { InspirationalQuote } from "@/components/common/inspirational-quote.component";

export function DashboardSidebar() {
  const { isOpen, isMobileOpen, setMobileSidebarOpen } = useSidebarStore();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[20rem] p-0 top-16 h-[calc(100vh-4rem)] border-0"
          style={{ top: "4rem", height: "calc(100vh - 4rem)" }}
        >
          <SheetTitle className="sr-only">Navigation Sidebar</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation menu for the dashboard
          </SheetDescription>

          {/* Apple Design System Mobile Sidebar */}
          <div className="flex h-[100%] flex-col glass-effect">
            <SidebarHeader className="border-b border-sidebar-border/30">
              <h1 className="text-title-2 font-semibold text-sidebar-foreground p-6 pb-4">
                Wellbore Navigator
              </h1>
            </SidebarHeader>

            <SidebarContent className="flex-1 overflow-y-auto px-4 py-2">
              <SidebarNav />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/30 p-4">
              <InspirationalQuote />
              <Button
                variant="plain"
                size="default"
                className="w-full justify-start gap-3 text-destructive hover:bg-destructive/8"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-callout">Sign Out</span>
              </Button>
            </SidebarFooter>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] w-[20rem] glass-effect border-r border-sidebar-border/20 transition-all duration-300 ease-apple z-40",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-[100%] flex-col">

        <SidebarContent className="flex-1 overflow-y-auto px-4 py-2">
          <SidebarNav />
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/30 p-4">
          <InspirationalQuote />
          {/* <Button
            variant="plain"
            size="default"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/8"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-callout">Sign Out</span>
          </Button> */}
        </SidebarFooter>
      </div>
    </aside>
  );
}
