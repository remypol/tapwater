import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { Logo } from "@/components/logo";

const navLinks = [
  { label: "News", href: "/news" },
  { label: "Rankings", href: "/compare" },
  { href: "/filters", label: "Filters" },
  { label: "Contaminants", href: "/contaminant" },
  { label: "Suppliers", href: "/supplier" },
  { label: "Guides", href: "/guides" },
  { label: "About", href: "/about" },
];

export function Header() {
  return (
    <header className="w-full bg-[var(--color-surface)]/90 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <NavLinks links={navLinks} />

        {/* Mobile hamburger + slide-down panel */}
        <MobileNav navLinks={navLinks} />
      </div>
    </header>
  );
}
