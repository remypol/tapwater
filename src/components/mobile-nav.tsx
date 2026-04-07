"use client";

import { useState, useEffect, useRef } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible only below sm */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-md text-muted hover:text-ink hover:bg-[var(--color-rule)] transition-colors"
      >
        <span className={["transition-transform duration-200 ease-in-out block", open ? "rotate-90" : "rotate-0"].join(" ")}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </span>
      </button>

      {/* Slide-down panel */}
      <div
        ref={panelRef}
        className={[
          "sm:hidden fixed inset-x-0 bg-surface/95 backdrop-blur-xl border-b border-rule z-40 transition-all duration-200 ease-in-out overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]",
          open ? "opacity-100 max-h-screen top-16" : "opacity-0 max-h-0 top-16 pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        <nav className="py-4">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={[
                  "block py-3 px-5 text-base hover:text-accent transition-colors border-l-2",
                  active
                    ? "text-ink font-semibold border-l-[var(--color-accent)]"
                    : "text-body border-l-transparent",
                ].join(" ")}
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {/* Postcode search */}
        <div className="mt-4 border-t border-rule px-5 pt-4 pb-5">
          <PostcodeSearch size="sm" />
        </div>
      </div>
    </>
  );
}
