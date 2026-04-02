"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { PostcodeSearch } from "@/components/postcode-search";

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
        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-md text-muted hover:text-ink hover:bg-[var(--color-rule)] transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Slide-down panel */}
      <div
        className={[
          "sm:hidden fixed inset-x-0 bg-surface/90 backdrop-blur-lg border-b border-rule z-40 transition-all duration-200 ease-in-out overflow-hidden",
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
                  "block py-3 px-5 text-body hover:text-accent transition-colors border-l-2",
                  active
                    ? "text-accent font-medium border-l-[var(--color-accent)]"
                    : "border-l-transparent",
                ].join(" ")}
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {/* Postcode search */}
        <div className="border-t border-rule px-5 py-4">
          <PostcodeSearch size="sm" />
        </div>
      </div>
    </>
  );
}
