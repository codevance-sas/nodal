'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Home,
  Database,
  Table,
  Drill,
  Thermometer,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';

export function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setOpenMobile(false);
    }
  };

  const navItems = [
    {
      title: 'User Data',
      items: [
        { title: 'Database', href: '#', icon: Database },
        { title: 'My Data Tables', href: '#', icon: Table },
      ],
    },
    {
      title: 'Builders',
      items: [
        {
          title: 'Wellbore Design',
          href: '/dashboard/nodal-modules/wellbore-design',
          icon: Drill,
        },
        {
          title: 'Nodal Analysis',
          href: '/dashboard/nodal-modules/nodal-analysis',
          icon: Thermometer,
        },
      ],
    },
    {
      title: 'Pre Builders',
      items: [
        { title: 'operators', href: '/dashboard/operators', icon: UserCog },
      ],
    },
  ];

  const getActiveGroups = () => {
    const activeGroups: string[] = [];
    for (const item of navItems) {
      if (item.items.some(subItem => pathname === subItem.href)) {
        activeGroups.push(item.title);
      }
    }
    return activeGroups;
  };

  return (
    <nav className="px-4 mt-4 space-y-2 overflow-auto h-[100%] flex flex-col justify-between">
      <div>
        <Link href="/dashboard" passHref onClick={handleLinkClick}>
          <Button
            variant={pathname === '/dashboard' ? 'tinted' : 'plain'}
            className="w-full justify-start gap-2 hover:bg-system-blue/10 hover:text-system-blue transition-colors duration-200"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
        <Accordion
          type="multiple"
          defaultValue={getActiveGroups()}
          className="w-full space-y-2 mt-2"
        >
          {navItems.map(group => (
            <AccordionItem
              value={group.title}
              key={group.title}
              className="border-b-0"
            >
              <AccordionTrigger className="px-2 py-2 text-sm rounded-md font-bold text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline [&>svg]:text-sidebar-foreground">
                <span className="truncate">{group.title}</span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <div className="pl-6 space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        href={item.href}
                        key={item.title}
                        passHref
                        onClick={handleLinkClick}
                      >
                        <Button
                          variant={pathname === item.href ? 'tinted' : 'plain'}
                          className="w-full justify-start gap-2 hover:bg-system-blue/10 hover:text-system-blue transition-colors duration-200"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </nav>
  );
}
