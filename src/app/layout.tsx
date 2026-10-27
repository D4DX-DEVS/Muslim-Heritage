import type { Metadata, Viewport } from "next";
import { Anek_Malayalam, Inter, Noto_Sans_Malayalam, Poppins } from "next/font/google";
import Script from "next/script";
import { indexingAllowed, siteUrl } from "@/lib/env";
import { REVEAL_BOOT_SCRIPT } from "@/lib/reveal";
import { SITE } from "@/lib/site";
import "./globals.css";

// Content is read from D1 on every request (bindings are unavailable at build time).
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-poppins", display: "swap" });
const notoMl = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["400", "500", "600", "700"], variable: "--font-noto-ml", display: "swap" });
const anekMl = Anek_Malayalam({ subsets: ["malayalam"], weight: ["500", "600", "700"], variable: "--font-anek-ml", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: SITE.name, template: `%s | ${SITE.shortName}` },
    description: SITE.description,
    applicationName: SITE.name,
    openGraph: { type: "website", siteName: SITE.name, locale: "ml_IN", images: ["/images/conf1.jpg"] },
    twitter: { card: "summary_large_image" },
    robots: indexingAllowed() ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b2e22",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script adds a class to <html> before hydration, hence suppressHydrationWarning.
    <html lang="ml" className={`${inter.variable} ${poppins.variable} ${notoMl.variable} ${anekMl.variable}`} suppressHydrationWarning>
      <head>
        <Script id="reveal-boot" strategy="beforeInteractive">
          {REVEAL_BOOT_SCRIPT}
        </Script>
      </head>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
