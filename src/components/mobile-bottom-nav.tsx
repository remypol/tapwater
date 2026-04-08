"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Zap,
  Search,
  BarChart3,
  MoreVertical,
  Filter,
  FlaskConical,
  Building2,
  BookOpen,
  Info,
} from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { PostcodeSearch } from "@/components/postcode-search";

const ACCENT = "#0891b2";
const INACTIVE = "#6b7280";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

function NavItem({ icon, label, active, onClick, href }: NavItemProps) {
  const color = active ? ACCENT : INACTIVE;
  const inner = (
    <span
      className="flex flex-col items-center gap-0.5"
      style={{ color }}
    >
      <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
      <span style={{ fontSize: 9, lineHeight: 1, fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}>
        {label}
      </span>
    </span>
  );

  const baseStyle: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    cursor: "pointer",
    background: "transparent",
    border: "none",
  };

  if (href) {
    return (
      <Link
        href={href}
        style={baseStyle}
        aria-current={active ? "page" : undefined}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={baseStyle} aria-label={label}>
      {inner}
    </button>
  );
}

const sheetLinks = [
  { href: "/filters", label: "Filters", icon: Filter },
  { href: "/contaminant", label: "Contaminants", icon: FlaskConical },
  { href: "/supplier", label: "Suppliers", icon: Building2 },
  { href: "/guides", label: "Guides", icon: BookOpen },
  { href: "/about", label: "About", icon: Info },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isHome = pathname === "/";
  const isNews = pathname.startsWith("/news");
  const isRankings =
    pathname.startsWith("/compare") || pathname.startsWith("/rankings");

  function handleSearch() {
    const input =
      document.querySelector<HTMLInputElement>("input[name='postcode']") ??
      document.querySelector<HTMLInputElement>(
        "input[placeholder*='postcode' i]"
      );
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus({ preventScroll: true });
    } else {
      router.push("/");
    }
  }

  return (
    <>
      {/* Floating pill bar */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="sm:hidden fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around"
        style={{
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: 20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          padding: "6px 6px calc(6px + env(safe-area-inset-bottom))",
        }}
      >
        <NavItem
          href="/"
          icon={<Home size={18} />}
          label="Home"
          active={isHome}
        />

        <NavItem
          href="/news"
          icon={<Zap size={18} />}
          label="News"
          active={isNews}
        />

        {/* Search CTA — centre, distinctive style */}
        <button
          type="button"
          onClick={handleSearch}
          aria-label="Search by postcode"
          style={{
            background: ACCENT,
            borderRadius: 14,
            padding: "8px 16px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            border: "none",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          <Search size={18} color="#fff" />
          <span
            style={{
              fontSize: 9,
              lineHeight: 1,
              color: "#fff",
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 500,
            }}
          >
            Search
          </span>
        </button>

        <NavItem
          href="/compare"
          icon={<BarChart3 size={18} />}
          label="Rankings"
          active={isRankings}
        />

        <NavItem
          icon={<MoreVertical size={18} />}
          label="More"
          onClick={() => setSheetOpen(true)}
        />
      </nav>

      {/* Bottom sheet — "More" contents */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-5 pb-2">
          {sheetLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSheetOpen(false)}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-3 w-full py-3 border-b border-[var(--color-rule)] last:border-none transition-colors"
                style={{
                  color: active ? ACCENT : "var(--color-body)",
                  minHeight: 48,
                }}
              >
                <Icon
                  size={18}
                  style={{ color: active ? ACCENT : "var(--color-muted)", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: 15,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* PostcodeSearch */}
        <div className="px-5 pt-3 pb-5 border-t border-[var(--color-rule)]">
          <PostcodeSearch size="sm" />
        </div>
      </BottomSheet>
    </>
  );
}
