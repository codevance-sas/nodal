'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { LogOut, User } from 'lucide-react';
import Image from 'next/image';

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b bg-sidebar text-sidebar-foreground px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarToggle />
        <div className="hidden items-center gap-2 md:flex">
          <Image
            src="/dashboard/header/img/logo.svg"
            alt="logo"
            width={132}
            height={40}
          />
        </div>
      </div>

      <div className="flex-1">{children}</div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="plain"
              className="flex items-center gap-3 p-2 rounded-full hover:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8 items-center justify-center">
                <AvatarFallback>DP</AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="font-bold text-sm">User</p>
                <p className="text-xs text-sidebar-foreground/80">
                  email@example.com
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="red" size="icon" className="md:hidden">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
