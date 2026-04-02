"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getScoreColor } from "@/lib/types";

interface RegionPostcode {
  district: string;
  areaName: string;
  score: number;
}

interface RegionSheetProps {
  regionId: string | null;
  regionName: string;
  postcodes: RegionPostcode[];
  onClose: () => void;
}

function scoreBadgeClass(score: number): string {
  const c = getScoreColor(score);
  if (c === "safe") return "badge badge-safe";
  if (c === "warning") return "badge badge-warning";
  return "badge badge-danger";
}

export function RegionSheet({
  regionId,
  regionName,
  postcodes,
  onClose,
}: RegionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isOpen = regionId !== null;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDragStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const clientY =
        "touches" in e ? e.touches[0].clientY : e.clientY;
      setDragStartY(clientY);
    },
    [],
  );

  const handleDragMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (dragStartY === null) return;
      const clientY =
        "touches" in e ? e.touches[0].clientY : e.clientY;
      const delta = clientY - dragStartY;
      // Only allow downward drag
      setDragOffset(Math.max(0, delta));
    },
    [dragStartY],
  );

  const handleDragEnd = useCallback(() => {
    if (dragOffset > 100) {
      onClose();
    }
    setDragStartY(null);
    setDragOffset(0);
  }, [dragOffset, onClose]);

  // Sorted postcodes by score ascending (worst first)
  const sorted = [...postcodes].sort((a, b) => a.score - b.score);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-2xl shadow-lg transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          height: "60vh",
          transform: isOpen
            ? `translateY(${dragOffset}px)`
            : "translateY(100%)",
          transition:
            dragStartY !== null ? "none" : "transform 0.3s ease-out",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`${regionName} water quality details`}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 rounded-full bg-faint" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 border-b border-rule">
          <h2 className="font-display text-xl text-ink italic">
            {regionName}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {sorted.length} postcode area{sorted.length !== 1 ? "s" : ""} with data
          </p>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1 px-5 py-3" style={{ maxHeight: "calc(60vh - 100px)" }}>
          {sorted.length === 0 && (
            <p className="text-sm text-faint py-6 text-center">
              No water quality data available for this region.
            </p>
          )}

          <div className="flex flex-col gap-1">
            {sorted.map((pc) => (
              <Link
                key={pc.district}
                href={`/postcode/${pc.district}/`}
                className="flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-lg hover:bg-wash transition-colors group"
              >
                <span className="font-data font-bold text-sm text-ink w-14 shrink-0">
                  {pc.district}
                </span>
                <span className="text-sm text-muted flex-1 truncate">
                  {pc.areaName}
                </span>
                <span className={`${scoreBadgeClass(pc.score)} font-data shrink-0`}>
                  {pc.score.toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
