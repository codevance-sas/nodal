import {
  Drill,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Thermometer,
  User,
  Database,
  Table,
  Home,
  Cog
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export type NavItemGroup = {
  title: string;
  items: NavItem[];
};

export const navItems: NavItemGroup[] = [
  {
    title: "User Data",
    items: [
       {
        title: "Database",
        href: "#", // Placeholder
        icon: Database,
      },
      {
        title: "My Data Tables",
        href: "#", // Placeholder
        icon: Table,
      },
    ]
  },
  {
    title: "Nodal Modules",
    items: [
      {
        title: "Wellbore Design",
        href: "/dashboard/nodal-modules/wellbore-design",
        icon: Drill,
      },
      {
        title: "Tubing Performance",
        href: "/dashboard/nodal-modules/tubing-performance",
        icon: Thermometer,
      },
      {
        title: "IPR Analysis",
        href: "/dashboard/nodal-modules/ipr-analysis",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Profile",
        href: "/dashboard/settings/profile",
        icon: User,
      },
      {
        title: "Preferences",
        href: "/dashboard/settings/preferences",
        icon: Settings,
      },
    ],
  },
];
