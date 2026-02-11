import type * as React from "react";
import { Command, Settings2, Users, Database } from "lucide-react";
import Image from "next/image";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
// Note: Icon components should not be passed across the server boundary.
// We'll pass string identifiers and map to icons in the client NavMain.

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: "dashboard",
    isActive: true,
  },
  {
    title: "Data",
    url: "/data",
    icon: "data",
    isActive: true,
  },
  {
    title: "LiquidPlus",
    url: "/client1",
    icon: "client1",
    isActive: true,
  },
  {
    title: "ADNA Research",
    url: "/client2",
    icon: "client2",
    isActive: true,
  },

  {
    title: "Demo Co.",
    url: "/client3",
    icon: "client3",
    isActive: true,
  },
  {
    title: "User Management",
    url: "/users",
    icon: "users",
    isActive: true,
    items: [
      {
        title: "All Users",
        url: "/users",
      },
      {
        title: "Roles",
        url: "/users/roles",
      },
    ],
  },
  {
    title: "Settings",
    url: "/account",
    icon: "settings",
    items: [
      {
        title: "Account",
        url: "/account",
      },
    ],
  },
];

export function AppSidebar({
  user,
  isLoading = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar?: string; role?: string };
  isLoading?: boolean;
}) {
  // Use placeholder for display purposes only (name/email)
  const displayUser = user ?? {
    name: "Loading…",
    email: "",
    avatar: undefined,
  };

  // Filter navigation items based on user role
  // IMPORTANT: Don't show any items while loading to prevent wrong permissions flash
  const getFilteredNavItems = () => {
    // If loading or no user data, show nothing
    if (isLoading || !user || !user.role) {
      return [];
    }

    if (user.role === "admin") {
      // Admin sees everything
      return navMain;
    } else if (user.role === "client1") {
      // Client1 sees only LiquidPlus and Settings (no Dashboard, no Data)
      return navMain.filter(
        (item) => item.title === "LiquidPlus" || item.title === "Settings"
      );
    } else if (user.role === "client2") {
      // Client2 sees only ADNA Research and Settings (no Dashboard, no Data)
      return navMain.filter(
        (item) => item.title === "ADNA Research" || item.title === "Settings"
      );
    }
    // Default: show nothing
    return [];
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image src="/logo.png" alt="Logo" width={32} height={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Bearded Gorilla</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getFilteredNavItems()} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
