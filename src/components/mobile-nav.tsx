"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface NavLink {
  label: string;
  href: string;
}

interface MobileNavProps {
  navLinks: NavLink[];
}

export function MobileNav({ navLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger button — visible only below sm */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-md text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Slide-down panel */}
      <div
        className={[
          "sm:hidden fixed inset-x-0 bg-[var(--color-surface)] border-b border-[var(--color-rule)] z-40 transition-all duration-200 ease-in-out overflow-hidden",
          open ? "opacity-100 max-h-screen top-16" : "opacity-0 max-h-0 top-16 pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        <nav className="py-4">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={[
                  "block py-2.5 px-5 text-body hover:text-[var(--color-accent)] transition-colors",
                  active ? "text-[var(--color-accent)] font-medium" : "",
                ].join(" ")}
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
