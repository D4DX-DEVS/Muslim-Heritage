import type { Metadata } from "next";
import { CircleUserRound } from "lucide-react";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";
import { Toaster } from "@/components/ui/sonner";
import { requireAdminPage } from "@/lib/auth/session";
import { logout } from "../(auth)/login/actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdminPage();
  return (
    <div className="flex min-h-dvh bg-muted/40">
      <AdminSidebar logoutAction={logout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-paper/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <AdminMobileNav logoutAction={logout} />
            <span className="font-heading text-sm font-semibold text-heritage-900">Muslim Heritage CMS</span>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CircleUserRound className="size-4" aria-hidden="true" /> {session.username}
          </span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
