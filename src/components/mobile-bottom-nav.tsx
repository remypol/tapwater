"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Droplet,
  Zap,
  BarChart3,
  Search,
  MoreVertical,
  Filter,
  FlaskConical,
  Building2,
  BookOpen,
  Info,
} from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { PostcodeSearch } from "@/components/postcode-search";

const ACCENT = "#ffd23f";
const INACTIVE = "#b9c8ea";

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
      <span style={{ fontSize: 9, lineHeight: 1, fontFamily: "var(--font-rht)", fontWeight: 600 }}>
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
  { href: "/postcode", label: "All postcodes", icon: Search },
  { href: "/compare", label: "Rankings", icon: BarChart3 },
  { href: "/filters", label: "Filters", icon: Filter },
  { href: "/contaminant", label: "Contaminants", icon: FlaskConical },
  { href: "/supplier", label: "Water companies", icon: Building2 },
  { href: "/rivers", label: "River health", icon: Droplet },
  { href: "/news", label: "News", icon: Zap },
  { href: "/about", label: "About the data", icon: Info },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Show when scrolling up or near the top, hide when scrolling down
        if (y < 50) {
          setVisible(true);
        } else if (y < lastScrollY.current) {
          setVisible(true);
        } else if (y > lastScrollY.current + 10) {
          setVisible(false);
        }
        lastScrollY.current = y;
        ticking.current = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const isHardness = pathname.startsWith("/hardness");
  const isGuides = pathname.startsWith("/guides");

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
        className="sm:hidden fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around motion-reduce:transition-none"
        style={{
          background: "rgba(3, 19, 73, 0.96)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          boxShadow: "0 8px 28px rgba(3, 19, 73, 0.35)",
          padding: "6px 6px calc(6px + env(safe-area-inset-bottom))",
          transform: visible ? "translateY(0)" : "translateY(calc(100% + 24px))",
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <NavItem
          href="/"
          icon={<Home size={18} />}
          label="Home"
          active={isHome}
        />

        <NavItem
          href="/hardness"
          icon={<Droplet size={18} />}
          label="Hardness"
          active={isHardness}
        />

        {/* Search CTA — centre, distinctive style */}
        <button
          type="button"
          onClick={handleSearch}
          aria-label="Search by postcode"
          style={{
            background: ACCENT,
            borderRadius: 999,
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
          <Search size={18} color="#08122e" />
          <span
            style={{
              fontSize: 9,
              lineHeight: 1,
              color: "#08122e",
              fontFamily: "var(--font-rhd)",
              fontWeight: 700,
            }}
          >
            Search
          </span>
        </button>

        <NavItem
          href="/guides"
          icon={<BookOpen size={18} />}
          label="Guides"
          active={isGuides}
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
