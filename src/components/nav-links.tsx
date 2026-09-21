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
    <nav className="tc-nav" aria-label="Main">
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
