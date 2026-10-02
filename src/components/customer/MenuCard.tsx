"use client";

import React from "react";
import Image from "next/image";
import { MenuItemType } from "@/types";
import { useCart } from "@/context/CartContext";
import { useHydrated } from "@/lib/useHydrated";
import { Plus, Minus } from "lucide-react";

interface MenuCardProps {
  item: MenuItemType;
  onOpenDetail: (item: MenuItemType) => void;
  onOpenCustomize: (item: MenuItemType) => void;
  onQuickAdd: (item: MenuItemType) => void;
}

const MenuCardComponent: React.FC<MenuCardProps> = ({
  item,
  onOpenDetail,
  onOpenCustomize,
  onQuickAdd,
}) => {
  const isAvailable = item.isAvailable;
  const isHydrated = useHydrated();
  const { cart, updateQuantity } = useCart();

  const matchingCartItems = cart.filter((ci) => ci.menuItemId === item.id);
  // Safely check hydrated state to avoid SSR hydration mismatch
  const currentQuantity = isHydrated
    ? matchingCartItems.reduce((sum, ci) => sum + ci.quantity, 0)
    : 0;

  const handleAddClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;

    if (item.hasSauceModifier) {
      onOpenCustomize(item);
    } else {
      onQuickAdd(item);
    }
  };

  const handleDecrement = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const lastItem = matchingCartItems[matchingCartItems.length - 1];
    if (lastItem) {
      updateQuantity(lastItem.cartItemId, -1);
    }
  };

  const handleIncrement = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;

    if (item.hasSauceModifier) {
      onOpenCustomize(item);
    } else {
      onQuickAdd(item);
    }
  };

  return (
    <div
      className={`group relative flex items-start justify-between gap-4 px-4 py-[22px] md:py-6 md:px-5 bg-surface transition-colors ${
        isAvailable
          ? "hover:bg-surface-subtle/30"
          : "opacity-60 bg-surface-subtle/50"
      }`}
    >
      {/* Sisi Kiri: Info Menu (Klik teks untuk buka Detail) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => isAvailable && onOpenDetail(item)}
        className="flex-1 min-w-0 pr-1 flex flex-col cursor-pointer select-none"
      >
        <h3 className="font-bold text-ink text-[15px] md:text-base leading-snug tracking-tight mb-1">
          {item.name}
        </h3>

        {item.description && (
          <p className="text-ink-muted text-xs md:text-[13px] line-clamp-2 leading-relaxed font-normal mb-2">
            {item.description}
          </p>
        )}

        {/* Harga */}
        <div className="mt-auto pt-1">
          <span className="font-extrabold text-ink text-base md:text-[17px]">
            {item.price.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Foto Menu + Tombol Add / Quantity */}
      <div className="flex flex-col items-center shrink-0 w-28 md:w-32">
        {/* Foto (Klik foto untuk buka Detail) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => isAvailable && onOpenDetail(item)}
          className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-surface cursor-pointer select-none"
        >
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 112px, 128px"
            className={`object-contain transition-transform duration-300 group-hover:scale-105 ${
              !isAvailable ? "grayscale" : ""
            }`}
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white text-xs font-bold px-2 py-1 rounded bg-black/60">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Tombol Add / Quantity Selector - Sedikit menimpa bagian bawah gambar */}
        <div className="-mt-4 w-[88%] z-10 flex flex-col items-center">
          {currentQuantity > 0 ? (
            <div className="w-full h-8 flex items-center justify-between px-1.5 rounded-full bg-surface border border-brand text-brand shadow-md">
              <button
                type="button"
                onClick={handleDecrement}
                className="btn-press w-6 h-6 rounded-full flex items-center justify-center text-brand hover:bg-brand-light active:scale-90 transition-all"
                aria-label="Kurangi jumlah"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <span className="font-extrabold text-xs md:text-sm text-brand select-none px-1">
                {currentQuantity}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                className="btn-press w-6 h-6 rounded-full flex items-center justify-center text-brand hover:bg-brand-light active:scale-90 transition-all"
                aria-label="Tambah jumlah"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleAddClick}
              className={`btn-press w-full py-1.5 px-3 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-1 border border-brand shadow-md transition-all ${
                isAvailable
                  ? "bg-surface text-brand hover:bg-brand-light active:scale-95"
                  : "bg-surface-subtle text-ink-faint border-surface-border cursor-not-allowed"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}

          {item.hasSauceModifier && isAvailable && (
            <span className="text-[10px] text-ink-muted mt-1 font-semibold tracking-tight">
              Customizable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const MenuCard = React.memo(MenuCardComponent);
