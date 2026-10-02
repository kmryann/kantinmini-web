"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/context/CartContext";
import { useHydrated } from "@/lib/useHydrated";
import { ShoppingBag, ArrowRight } from "lucide-react";

export const FloatingCartBar: React.FC = () => {
  const isHydrated = useHydrated();
  const { totalItems, subtotal, tableNumber } = useCart();

  if (!isHydrated || totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Keranjang Belanja"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-brand via-[#0E8064] to-[#0A6B53] text-white shadow-[0_-4px_24px_rgba(0,0,0,0.18)] border-t border-white/20"
      >
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left Info: Frosted Glass Cart Icon + Item Count + Subtotal */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-amber-400 text-gray-950 text-[11px] font-black flex items-center justify-center border-2 border-brand shadow-xs">
                {totalItems}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-100/90 leading-tight truncate">
                <span>{totalItems} Menu</span>
                <span>•</span>
                <span>Meja {tableNumber}</span>
              </div>
              <div className="text-base sm:text-lg font-black text-white leading-snug tracking-tight truncate">
                Rp {subtotal.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Right Action: Modern Rounded-xl Button */}
          <Link
            href={`/order/cart?table=${tableNumber}`}
            className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-brand font-black text-xs sm:text-sm shadow-sm transition-all shrink-0 active:scale-95"
          >
            <span>Lihat Pesanan</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
