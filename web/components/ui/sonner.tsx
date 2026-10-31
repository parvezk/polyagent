"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

// Glyphs match the design system's StatusMark: ✓ success, ✕ error, ! needs attention, i info.
const glyph = (g: string) => (
  <span aria-hidden className="font-mono text-xs font-bold leading-none">
    {g}
  </span>
);

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: glyph("✓"),
        info: glyph("i"),
        warning: glyph("!"),
        error: glyph("✕"),
        loading: glyph("…"),
      }}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: "pa-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
