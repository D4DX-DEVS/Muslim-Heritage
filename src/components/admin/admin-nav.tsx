"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  ClipboardList,
  ExternalLink,
  FilePlus2,
  FileText,
  Images,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  UserRound,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const GROUPS = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    title: "Content",
    items: [
      { href: "/admin/articles", label: "All articles", icon: FileText, exact: true },
      { href: "/admin/articles/new", label: "Create article", icon: FilePlus2, exact: true },
      { href: "/admin/sections", label: "Sections", icon: Layers },
      { href: "/admin/authors", label: "Authors", icon: UserRound },
      { href: "/admin/boards", label: "Boards", icon: Users },
      { href: "/admin/pages", label: "Static pages", icon: BookOpen },
    ],
  },
  { title: "Media", items: [{ href: "/admin/media", label: "Media library", icon: Images }] },
  {
    title: "System",
    items: [
      { href: "/admin/migration", label: "Migration report", icon: ClipboardList },
      { href: "/admin/activity", label: "Activity log", icon: Activity },
    ],
  },
];

function active(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href || (href === "/admin/articles" && /^\/admin\/articles\/\d+/.test(pathname));
  return pathname.startsWith(href);
}

function NavBody({ onNavigate, logoutAction }: { onNavigate?: () => void; logoutAction: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Link href="/admin" onClick={onNavigate}>
          <Image src="/images/logo.webp" alt="Kerala Muslim Heritage Foundation" width={372} height={89} className="h-9 w-auto" />
        </Link>
      </div>
      <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white/45">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon, exact }) => {
                const on = active(pathname, href, exact);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-white/75 transition-colors hover:bg-sidebar-accent hover:text-white",
                        on && "bg-sidebar-accent font-medium text-white shadow-[inset_3px_0_0_var(--gold-500)]",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-sidebar-border p-3">
        <a href="/" target="_blank" rel="noopener" className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-white/75 hover:bg-sidebar-accent hover:text-white">
          <ExternalLink className="size-4" aria-hidden="true" /> View website
        </a>
        <form action={logoutAction}>
          <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-white/75 hover:bg-sidebar-accent hover:text-white">
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar({ logoutAction }: { logoutAction: () => Promise<void> }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 bg-sidebar text-sidebar-foreground lg:block">
      <NavBody logoutAction={logoutAction} />
    </aside>
  );
}

export function AdminMobileNav({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex size-11 items-center justify-center rounded-md hover:bg-accent lg:hidden" aria-label="Open admin menu">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="sr-only">
          <SheetTitle>Admin menu</SheetTitle>
          <SheetDescription>Content management navigation</SheetDescription>
        </SheetHeader>
        <NavBody onNavigate={() => setOpen(false)} logoutAction={logoutAction} />
      </SheetContent>
    </Sheet>
  );
}
