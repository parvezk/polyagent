import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
            <span className="text-sm text-zinc-500">· vendor-agnostic agent control plane</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-7">{children}</main>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
