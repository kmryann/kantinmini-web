"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousBodyOverflow = "";

/**
 * Hook to lock body scroll when modals or overlays are open.
 * Supports nested/sequential modals with a reference counter.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

    if (lockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = previousBodyOverflow || "";
      }
    };
  }, [isLocked]);
}
