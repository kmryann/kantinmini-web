"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { MenuItemType } from "@/types";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { X } from "lucide-react";

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
  // Prevent background scrolling when modal is open
  useBodyScrollLock(Boolean(isOpen && item));

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
        <div
          key="menu-detail-modal-overlay"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
        >
          {/* Backdrop Scrim - Clean dark overlay without heavy GPU blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 will-change-[opacity]"
          />

          {/* Bottom Sheet Modal with Apple iOS smooth curve */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              willChange: "transform",
              transform: "translateZ(0)",
            }}
            className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
          >
            {/* Grab Handle & Close Button */}
            <div className="pt-3 pb-2 px-5 flex items-center justify-between shrink-0">
              <div className="w-8" />
              <div className="w-12 h-1 rounded-full bg-gray-300" />
              <button
                type="button"
                onClick={onClose}
                className="btn-press w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {/* Hero Image (1:1 aspect ratio) */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shrink-0 flex items-center justify-center">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 512px"
                  decoding="async"
                  className="object-contain p-2"
                />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mt-4">
                {item.name}
              </h2>

              {/* Description */}
              {item.description && (
                <p className="text-sm text-gray-500 leading-relaxed mt-1.5 font-normal">
                  {item.description}
                </p>
              )}

              {/* Price */}
              <div className="text-md md:text-lg font-semibold text-gray-900 mt-3">
                {item.price.toLocaleString("id-ID")}
              </div>

              {/* Bottom Action Button: Always Add to cart */}
              <div className="mt-6 pt-1">
                <button
                  type="button"
                  onClick={handleAction}
                  className="btn-press w-full py-3.5 px-6 rounded-full bg-brand hover:bg-brand-hover text-white font-bold text-base flex items-center justify-center shadow-sm transition-colors"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
