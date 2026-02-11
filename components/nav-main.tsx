"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Users as LucideUsers,
  Settings2 as LucideSettings2,
  Database as LucideDatabase,
} from "lucide-react";
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// Map string identifiers to icon components on the client
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: IconDashboard,
  data: LucideDatabase,
  client1: IconListDetails,
  client2: IconChartBar,
  users: LucideUsers,
  settings: LucideSettings2,
};

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: string | LucideIcon | ComponentType<{ className?: string }>;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <a href={item.url}>
                    {typeof item.icon === "string" ? (
                      (() => {
                        const IconComp = iconMap[item.icon] ?? IconDashboard;
                        return <IconComp />;
                      })()
                    ) : (
                      <item.icon />
                    )}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubItemActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubItemActive}
                              >
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
