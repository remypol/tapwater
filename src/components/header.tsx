import Link from "next/link";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Methodology", href: "/about/methodology" },
  { label: "Data Sources", href: "/about/data-sources" },
];

export function Header() {
  return (
    <header className="w-full bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-0 tracking-tight"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          <span className="text-xl text-[var(--color-ink)]">tapwater</span>
          <span className="text-xl text-[var(--color-accent)]">.uk</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] underline-offset-4 decoration-1 decoration-[var(--color-rule)] hover:underline transition-colors duration-150"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
