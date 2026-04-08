"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);

  // Escape key dismissal
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchCurrentY.current = e.touches[0].clientY;
    const delta = touchCurrentY.current - touchStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }

  function handleTouchEnd() {
    const delta = touchCurrentY.current - touchStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    if (delta > 80) {
      onClose();
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={[
          "sm:hidden fixed inset-0 z-50 bg-black/50",
          "transition-opacity",
          open ? "opacity-100 duration-150" : "opacity-0 duration-150 pointer-events-none",
          "motion-reduce:transition-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={[
          "sm:hidden fixed bottom-0 left-0 right-0 z-50",
          "bg-[var(--color-surface)] rounded-t-2xl",
          "max-h-[60vh] overflow-y-auto",
          "transition-transform duration-200 ease-out",
          "motion-reduce:transition-none",
          open ? "translate-y-0" : "translate-y-full pointer-events-none",
        ].join(" ")}
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[var(--color-surface)]">
          <div className="w-8 h-1 rounded-full bg-gray-400/60" />
        </div>

        {children}
      </div>
    </>
  );
}
