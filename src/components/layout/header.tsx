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
import { ModeToggle } from '@/components/mode-toggle';
import { useTheme } from 'next-themes';
import { LogOut, Users, Key, Globe } from 'lucide-react';
import Image from 'next/image';
import { logoutAction } from '@/actions/auth/auth.action';
import Link from 'next/link';

export function Header({
  email,
  role,
  children,
}: {
  email: string;
  role: 'admin' | 'user';
  children?: React.ReactNode;
}) {
  const { theme } = useTheme();

  const isAdmin = role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b bg-sidebar text-sidebar-foreground px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarToggle />
        <div className="hidden items-center gap-2 md:flex">
          <Image
            src={
              theme === 'dark'
                ? '/dashboard/header/img/logo-dark.png'
                : theme === 'light'
                ? '/dashboard/header/img/logo-light.png'
                : '/dashboard/header/img/logo.svg'
            }
            alt="logo"
            width={132}
            height={40}
            suppressHydrationWarning
          />
        </div>
      </div>

      <div className="flex-1">{children}</div>

      <div className="flex items-center gap-4">
        <ModeToggle />
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
                <p className="text-xs text-sidebar-foreground/80">{email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/admin/user-management"
                    className="flex items-center"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>User Management</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/admin/token-management"
                    className="flex items-center"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    <span>Token Management</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/admin/domain-management"
                    className="flex items-center"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Domain Management</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={logoutAction}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          className="md:hidden"
          onClick={logoutAction}
          size="icon"
          variant="plain"
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  );
}
