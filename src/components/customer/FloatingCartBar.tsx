"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, ArrowRight } from "lucide-react";

export const FloatingCartBar: React.FC = () => {
  const { totalItems, subtotal, setIsCartDrawerOpen } = useCart();

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-lg mx-auto pointer-events-none">
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="pointer-events-auto"
        >
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="btn-press w-full p-3.5 rounded-2xl frosted-glass border border-brand/40 shadow-xl flex items-center justify-between gap-3 text-ink bg-surface/90 hover:bg-surface transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] font-black flex items-center justify-center border-2 border-surface">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <div className="text-xs text-ink-muted font-medium">Total Pesanan</div>
                <div className="text-base font-extrabold text-brand">
                  Rp {subtotal.toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm font-bold text-ink px-3 py-1.5 rounded-xl bg-brand-light text-brand">
              Checkout
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
