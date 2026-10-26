"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/confindex/1") return /^\/(confindex|innerindex)\//.test(pathname);
  if (href === "/articles") return pathname.startsWith("/articles") || pathname.startsWith("/innermore");
  if (href === "/authors") return pathname.startsWith("/author");
  if (href === "/about") return ["/about", "/director", "/advisory"].includes(pathname);
  return pathname.startsWith(href);
}

export function NavLinks({ items, vertical = false, onNavigate }: { items: readonly NavItem[]; vertical?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className={cn("flex", vertical ? "flex-col gap-1" : "items-center gap-1")}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-(--duration-fast)",
                vertical ? "text-base text-heritage-900 hover:bg-accent" : "text-white/80 hover:text-white",
                active && (vertical ? "bg-accent text-heritage-900" : "text-white"),
                !vertical &&
                  "after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-gold-500 after:transition-transform after:duration-(--duration-base) hover:after:scale-x-100",
                !vertical && active && "after:scale-x-100",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
