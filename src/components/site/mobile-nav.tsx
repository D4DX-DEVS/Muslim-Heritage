"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./nav-links";

interface NavItem {
  href: string;
  label: string;
}

export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex size-11 items-center justify-center rounded-md text-white/85 hover:bg-white/10 hover:text-white lg:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)] bg-paper">
        <SheetHeader>
          <SheetTitle className="font-heading text-heritage-900">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-4">
          <NavLinks
            items={[...items, { href: "/director", label: "Director Board" }, { href: "/advisory", label: "Advisory Board" }]}
            vertical
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
