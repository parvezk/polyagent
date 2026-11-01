"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Agents" },
  { href: "/queue", label: "Queue" },
];

export function NavLinks() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Main" className="flex items-center gap-3">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-1 py-1 text-sm transition-colors ${
              active
                ? "border-ink font-semibold text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
