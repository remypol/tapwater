"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin progress bar at the top of the viewport during client-side navigation.
 * Shows when an internal link is clicked, hides when the pathname changes.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    // Safety: auto-hide after 30s
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLoading(false), 30000);
  }, []);

  // Navigation complete — pathname changed
  useEffect(() => {
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [pathname]);

  // Listen for clicks on internal links
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (anchor.target === "_blank") return;

      // Don't show for same-page links
      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname) return;

      startLoading();
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, startLoading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden">
      <div
        className="h-full bg-accent rounded-r-full shadow-[0_0_8px_rgba(8,145,178,0.6)]"
        style={{
          animation: "nav-progress 12s cubic-bezier(0.4, 0, 0, 1) forwards",
        }}
      />
      <style>{`
        @keyframes nav-progress {
          0% { width: 0%; }
          10% { width: 25%; }
          30% { width: 50%; }
          60% { width: 75%; }
          90% { width: 92%; }
          100% { width: 96%; }
        }
      `}</style>
    </div>
  );
}
