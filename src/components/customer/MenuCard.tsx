"use client";

import React from "react";
import Image from "next/image";
import { MenuItemType } from "@/types";
import { Plus } from "lucide-react";

interface MenuCardProps {
  item: MenuItemType;
  onOpenDetail: (item: MenuItemType) => void;
  onOpenCustomize: (item: MenuItemType) => void;
  onQuickAdd: (item: MenuItemType) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  onOpenDetail,
  onOpenCustomize,
  onQuickAdd,
}) => {
  const isAvailable = item.isAvailable;

  const handleAddClick = (e: React.MouseEvent | React.TouchEvent) => {
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
      className={`group relative flex items-start justify-between gap-4 p-4 rounded-2xl bg-surface border border-surface-border/80 transition-all ${
        isAvailable
          ? "hover:border-brand-muted/70 hover:shadow-xs"
          : "opacity-60 bg-surface-subtle"
      }`}
    >
      {/* Sisi Kiri: Info Menu (Klik teks untuk buka Detail) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => isAvailable && onOpenDetail(item)}
        className="flex-1 min-w-0 pr-1 flex flex-col justify-between self-stretch cursor-pointer select-none"
      >
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <h3 className="font-bold text-ink text-base md:text-lg leading-snug tracking-tight">
              {item.name}
            </h3>
            {item.isBestSeller && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-light text-brand border border-brand-muted/40">
                Best Seller
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-ink-muted text-xs md:text-sm line-clamp-2 leading-relaxed mb-3">
              {item.description}
            </p>
          )}
        </div>

        {/* Harga */}
        <div className="mt-auto pt-2">
          <span className="font-extrabold text-ink text-base md:text-lg">
            {item.price.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Foto Menu + Tombol Add */}
      <div className="flex flex-col items-center shrink-0 w-28 md:w-32">
        {/* Foto (Klik foto untuk buka Detail) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => isAvailable && onOpenDetail(item)}
          className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-surface-subtle border border-surface-border/50 cursor-pointer select-none"
        >
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 112px, 128px"
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
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

        {/* Tombol Add Mandiri */}
        <div className="mt-2 w-full flex flex-col items-center">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddClick}
            className={`btn-press w-full py-1.5 px-3 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-1 border transition-all ${
              isAvailable
                ? "bg-surface text-brand border-brand hover:bg-brand hover:text-white shadow-xs"
                : "bg-surface-subtle text-ink-faint border-surface-border cursor-not-allowed"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>

          {item.hasSauceModifier && isAvailable && (
            <span className="text-[10px] text-ink-muted mt-1 font-medium tracking-tight">
              Customizable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
