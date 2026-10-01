"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { MenuItemType } from "@/types";
import { X, Sparkles, SlidersHorizontal, Plus } from "lucide-react";

interface MenuDetailModalProps {
  item: MenuItemType | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomize: (item: MenuItemType) => void;
  onQuickAdd: (item: MenuItemType) => void;
}

export const MenuDetailModal: React.FC<MenuDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenCustomize,
  onQuickAdd,
}) => {
  if (!item) return null;

  const handleAction = () => {
    if (item.hasSauceModifier) {
      onClose();
      onOpenCustomize(item);
    } else {
      onQuickAdd(item);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
          />

          {/* Spring Bottom Sheet (Apple-style 3/4 screen on mobile) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 h-[75vh] sm:h-auto sm:max-h-[85vh] flex flex-col"
          >
            {/* Grab Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-surface-muted/90" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="btn-press absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-sm text-ink-muted hover:text-ink flex items-center justify-center border border-surface-border/50 shadow-xs"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 pt-1">
              {/* Hero Image (1:1 aspect ratio, centered, setengah tinggi modal) */}
              <div className="relative w-48 h-48 sm:w-60 sm:h-60 aspect-square mx-auto rounded-2xl overflow-hidden bg-surface-subtle border border-surface-border/50 shrink-0 shadow-xs">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 192px, 240px"
                  className="object-cover"
                />
              </div>

              {/* Title & Price */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-extrabold text-ink display-title leading-tight">
                    {item.name}
                  </h2>
                  <span className="text-lg md:text-xl font-black text-brand shrink-0">
                    Rp {item.price.toLocaleString("id-ID")}
                  </span>
                </div>

                {item.isBestSeller && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-light text-brand border border-brand-muted/40">
                    <Sparkles className="w-3.5 h-3.5" />
                    Paling Banyak Dipesan
                  </div>
                )}

                {item.description && (
                  <p className="text-sm md:text-base text-ink-muted leading-relaxed pt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Sticky Action Button */}
            <div className="p-4 border-t border-surface-border bg-surface">
              <button
                type="button"
                onClick={handleAction}
                className="btn-press w-full py-3.5 px-5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                {item.hasSauceModifier ? (
                  <>
                    <SlidersHorizontal className="w-5 h-5" />
                    Kustomisasi Saus & Catatan
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Tambah ke Keranjang • Rp {item.price.toLocaleString("id-ID")}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
