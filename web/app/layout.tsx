import type { Metadata } from "next";
import { Suspense } from "react";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu } from "@/components/user-menu";
import { NavLinks } from "@/components/nav-links";
import { Wordmark } from "@/components/wordmark";
import { PostHogIdentify } from "@/components/posthog-identify";
import { PostHogPageView } from "@/components/posthog-pageview";

// Atkinson Hyperlegible was drawn for legibility: the product's job is making agent work readable.
const sans = Atkinson_Hyperlegible_Next({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});
const mono = Atkinson_Hyperlegible_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "PolyAgent — agent control plane",
  description: "Vendor-agnostic cloud agent orchestration",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {/* Plain header bar: paper, one rule, no blur */}
        <header className="sticky top-0 z-20 border-b border-rule bg-paper">
          <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-6 py-3">
            <Wordmark />
            <NavLinks />
            <span className="hidden text-sm text-ink-muted md:inline">
              One queue for coding agents from any vendor
            </span>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-10">{children}</main>
        <PostHogIdentify />
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        <SpeedInsights />
        <Toaster position="bottom-right" visibleToasts={3} />
      </body>
    </html>
  );
}
