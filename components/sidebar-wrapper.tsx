import { AppSidebar } from "./app-sidebar";
import type { Sidebar } from "./ui/sidebar";
import { getSession } from "@/lib/auth";

// Server Component wrapper to eliminate client-side flicker
export async function SidebarWrapper(
  props: React.ComponentProps<typeof Sidebar>
) {
  const session = await getSession();
  // Render sidebar immediately on the server with the real session
  return (
    <AppSidebar user={session ?? undefined} isLoading={false} {...props} />
  );
}
