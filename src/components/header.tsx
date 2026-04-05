import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { Logo } from "@/components/logo";

const navLinks = [
  { label: "Rankings", href: "/compare" },
  { href: "/filters", label: "Filters" },
  { label: "Contaminants", href: "/contaminant" },
  { label: "Suppliers", href: "/supplier" },
  { label: "Guides", href: "/guides" },
  { label: "About", href: "/about" },
];

export function Header() {
  return (
    <header className="w-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-ink underline-offset-4 decoration-1 decoration-[var(--color-rule)] hover:underline transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger + slide-down panel */}
        <MobileNav navLinks={navLinks} />
      </div>
    </header>
  );
}
