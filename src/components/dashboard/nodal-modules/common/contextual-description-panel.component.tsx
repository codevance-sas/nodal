'use client';

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState, type FC } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

interface ContextualDescriptionPanelProps {
  children: React.ReactNode;
  anchor?: 'left' | 'right';
  drawerWidth?: number;
  appBarHeight?: number;
  uiSidebarWidth?: number;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}

export const ContextualDescriptionPanel: FC<
  ContextualDescriptionPanelProps
> = ({
  children,
  anchor = 'left',
  drawerWidth = 350,
  appBarHeight = 64,
  uiSidebarWidth = 320,
  icon,
  title = 'Configuration Panel',
  description = 'Adjust settings and parameters',
}) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(prev => !prev);

  const { isOpen: isMainSidebarOpen } = useSidebarStore();

  const isLeft = anchor === 'left';
  const baseOffset = isLeft && isMainSidebarOpen ? uiSidebarWidth : 0;

  const ButtonIcon = open
    ? isLeft
      ? ChevronLeft
      : ChevronRight
    : isLeft
    ? ChevronRight
    : ChevronLeft;

  const horizontalPos = isLeft
    ? { left: `${baseOffset + (open ? drawerWidth - 15 : -15)}px` }
    : { right: `${open ? drawerWidth - 15 : -15}px` };

  const verticalCenter = `calc(${appBarHeight}px + (100vh - ${appBarHeight}px) / 2)`;

  return (
    <>
      <Button
        onClick={toggle}
        size="icon"
        className={cn(
          'fixed z-50 glass-effect',
          'h-12 w-12 rounded-full shadow-lg',
          'bg-system-gray6/90 dark:bg-system-gray6/95',
          'border border-border/30',
          'text-system-blue hover:text-system-blue/80',
          'hover:bg-system-gray5/90 dark:hover:bg-system-gray5/95',
          'active:scale-95 transition-all duration-200 ease-apple',
          'focus-visible:ring-2 focus-visible:ring-system-blue focus-visible:ring-offset-2',
          'hover:shadow-xl hover:shadow-system-blue/20'
        )}
        style={{
          top: verticalCenter,
          transform: 'translateY(-50%)',
          ...horizontalPos,
          transition: `${
            isLeft ? 'left' : 'right'
          } 200ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {icon || <ButtonIcon className="h-5 w-5" />}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side={anchor}
          className={cn(
            'glass-effect p-0 border-border/20',
            'shadow-2xl backdrop-blur-xl',
            'w-auto data-[state=open]:animate-slide-in-from-left data-[state=closed]:animate-slide-out-to-left',
            anchor === 'right' &&
              'data-[state=open]:animate-slide-in-from-right data-[state=closed]:animate-slide-out-to-right'
          )}
          style={{
            width: `${drawerWidth}px`,
            top: `${appBarHeight}px`,
            height: `calc(100% - ${appBarHeight}px)`,
            ...(isLeft ? { left: `${baseOffset}px` } : {}),
          }}
        >
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>

          <div
            className={cn(
              'h-[100%] overflow-y-auto',
              'p-6 space-y-6',
              'scrollbar-thin scrollbar-thumb-system-gray4 scrollbar-track-transparent',
              'hover:scrollbar-thumb-system-gray3'
            )}
            style={{ width: `${drawerWidth}px` }}
          >
            <div className="space-y-2 border-b border-border/20 pb-4">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-system-blue/10 text-system-blue">
                    {icon}
                  </div>
                )}
                <h2 className="text-title-3 font-semibold text-foreground">
                  {title}
                </h2>
              </div>
              <p className="text-footnote text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            <div className="space-y-6">{children}</div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
