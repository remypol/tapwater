"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  label: string;
  href: string;
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-7">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? "text-sm text-ink font-semibold underline-offset-4 decoration-1 decoration-[var(--color-accent)] underline"
                : "text-sm text-muted hover:text-ink underline-offset-4 decoration-1 decoration-[var(--color-rule)] hover:underline transition-colors duration-150"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
