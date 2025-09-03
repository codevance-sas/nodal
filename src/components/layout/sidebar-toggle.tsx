"use client"

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function SidebarToggle() {

  const {
    isOpen,
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar
  } = useSidebarStore();
  const isMobile = useIsMobile();

  const handleToggle = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  const isCurrentlyOpen = isMobile ? isMobileOpen : isOpen;

  return (

    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn(
        "h-10 w-10 hover:bg-sidebar-accent transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
      aria-label={isCurrentlyOpen ? "Cerrar sidebar" : "Abrir sidebar"}
    >
      {isCurrentlyOpen ? (
        <>
          <X className="h-6 w-6 text-sidebar-foreground" />
        </>
      ) : (
        <Menu className="h-6 w-6 text-sidebar-foreground" />
      )}
    </Button>
  );
} 