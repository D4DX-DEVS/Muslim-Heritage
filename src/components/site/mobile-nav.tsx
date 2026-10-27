"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Mail, Menu, Phone, Search, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { isActive } from "./nav-links";

interface NavItem {
  href: string;
  label: string;
}

const BOARDS = [
  { href: "/director", label: "Director Board" },
  { href: "/advisory", label: "Advisory Board" },
];

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * Phone and tablet menu: a dark full-height panel whose links are set large and rise in one after
 * another; the current page is marked in gold. Search and the foundation's contacts sit at the foot.
 */
export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex size-11 items-center justify-center rounded-md text-white/85 transition-[background-color,color,transform] hover:bg-white/10 hover:text-white active:scale-90 lg:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 overflow-y-auto border-none bg-heritage-950 p-0 text-white data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
          <Image src="/images/logo.webp" alt={SITE.name} width={372} height={89} className="h-9 w-auto" />
          <SheetClose
            aria-label="Close menu"
            className="inline-flex size-11 items-center justify-center bg-white/10 text-white transition-[background-color,transform] duration-(--duration-base) hover:rotate-90 hover:bg-gold-500 hover:text-heritage-950 active:scale-90"
          >
            <X className="size-5" />
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>

        <nav aria-label="Mobile" className="flex flex-1 flex-col px-4 pb-6 pt-4 sm:px-6">
          <ul className="space-y-1">
            {items.map((item, i) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="anim-rise" style={{ ...rise(i), "--rise": "18px" } as React.CSSProperties}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-14 items-center gap-3 py-2 font-heading text-[1.75rem] font-semibold leading-tight transition-colors duration-(--duration-base)",
                      active ? "text-gold-500" : "text-white hover:text-gold-200",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "block size-2 shrink-0 rotate-45 bg-gold-500 transition-transform duration-300 ease-(--ease-out)",
                        active ? "scale-100" : "scale-0 group-hover:scale-100",
                      )}
                    />
                    <span className="flex-1 transition-transform duration-300 ease-(--ease-out) group-hover:translate-x-1 group-active:translate-x-1">
                      {item.label}
                    </span>
                    <ArrowUpRight
                      className="size-5 text-white/40 transition-[color,transform] duration-300 ease-(--ease-out) group-hover:rotate-45 group-hover:text-gold-500"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <ul className="anim-rise mt-6 flex flex-wrap gap-2" style={rise(items.length)}>
            {BOARDS.map((b) => (
              <li key={b.href}>
                <Link
                  href={b.href}
                  onClick={close}
                  aria-current={isActive(pathname, b.href) && pathname === b.href ? "page" : undefined}
                  className="inline-flex min-h-11 items-center bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/20 aria-[current=page]:bg-gold-500 aria-[current=page]:text-heritage-950"
                >
                  {b.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="anim-rise mt-auto space-y-4 pt-10" style={rise(items.length + 1)}>
            <Link
              href="/search"
              onClick={close}
              className="group flex min-h-13 items-center gap-3 bg-gold-500 px-5 font-semibold text-heritage-950 transition-[background-color,transform] duration-(--duration-base) hover:bg-gold-200 active:scale-[0.98]"
            >
              <Search className="size-5 transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true" />
              Search the archive
            </Link>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
              <a href={`mailto:${SITE.email}`} className="inline-flex min-h-11 items-center gap-2 hover:text-white">
                <Mail className="size-4 text-gold-500" aria-hidden="true" />
                {SITE.email}
              </a>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-2 hover:text-white">
                <Phone className="size-4 text-gold-500" aria-hidden="true" />
                {SITE.phone}
              </a>
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
