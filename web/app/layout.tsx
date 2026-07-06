import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu } from "@/components/user-menu";
import { PostHogIdentify } from "@/components/posthog-identify";
import { PostHogPageView } from "@/components/posthog-pageview";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PolyAgent — agent control plane",
  description: "Vendor-agnostic cloud agent orchestration",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        {/* Sticky branded header — persists for the whole session */}
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-6 py-3">
            <span className="text-[#D97757]">◆</span>
            <span className="font-semibold tracking-tight">PolyAgent</span>
            <span className="hidden text-sm text-zinc-500 md:inline">
              · Assemble the best team for every job — under one roof
            </span>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-7">{children}</main>
        <PostHogIdentify />
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
