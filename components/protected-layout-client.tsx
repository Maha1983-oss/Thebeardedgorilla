"use client";

import * as React from "react";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";

export function ProtectedLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a similar structure but without the dynamic sidebar
    return (
      <div className="[--header-height:calc(--spacing(14))]">
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <SidebarWrapper />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
