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
import { LogOut, User } from 'lucide-react';
import Image from 'next/image';

export function Header({ children }: { children?: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b bg-sidebar text-sidebar-foreground px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarToggle />
        <div className="hidden items-center gap-2 md:flex">
          <div
            suppressHydrationWarning
            className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
              theme !== 'dark'
                ? 'bg-gray-900/90 backdrop-blur-sm'
                : 'bg-transparent'
            }`}
          >
            <Image
              src="/dashboard/header/img/logo.svg"
              alt="logo"
              width={132}
              height={40}
            />
          </div>
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
                <p className="font-bold text-sm">Usuario</p>
                <p className="text-xs text-sidebar-foreground/80">
                  email@example.com
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="plain" size="icon" className="md:hidden">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
