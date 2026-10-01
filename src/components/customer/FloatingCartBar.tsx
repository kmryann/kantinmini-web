"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, ArrowRight } from "lucide-react";

export const FloatingCartBar: React.FC = () => {
  const { totalItems, subtotal, tableNumber } = useCart();

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      >
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Cart Info */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                {totalItems}
              </span>
            </div>
            <div>
              <div className="text-[11px] text-gray-500 font-medium">Total Pesanan</div>
              <div className="text-base font-extrabold text-gray-900 leading-tight">
                Rp {subtotal.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Action Link to Full Cart Page */}
          <Link
            href={`/order/cart?table=${tableNumber}`}
            className="btn-press flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#008a00] hover:bg-[#007500] text-white text-xs md:text-sm font-bold shadow-sm transition-colors"
          >
            <span>Lihat Keranjang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
