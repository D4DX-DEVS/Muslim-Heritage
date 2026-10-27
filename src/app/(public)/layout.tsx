import { RevealObserver } from "@/components/site/reveal-observer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// On large screens the footer sits still underneath and <main> slides up off it like a curtain.
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative z-10 flex-1 bg-background">
        {children}
      </main>
      <SiteFooter />
      <RevealObserver />
    </>
  );
}
