"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MenuItemType } from "@/types";
import { Heart, Info, Share2 } from "lucide-react";

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
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);

  if (!item || !isOpen) return null;

  const handleAction = () => {
    if (item.hasSauceModifier) {
      onClose();
      onOpenCustomize(item);
    } else {
      onQuickAdd(item);
      onClose();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: item.description || `Pesan ${item.name} di Kantin Mini!`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback below
      }
    }
    navigator.clipboard.writeText(window.location.href);
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Bottom Sheet Modal (persis referensi references/detail-menu-modal.png) */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
      >
        {/* Grab Handle */}
        <div className="pt-3 pb-2 flex justify-center shrink-0">
          <div className="w-12 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Hero Image (1:1 aspect ratio, rounded-2xl sesuai screenshot) */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-sky-100/60 border border-sky-200/40 shrink-0">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight uppercase mt-4">
            {item.name}
          </h2>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-500 leading-relaxed mt-1.5 font-normal">
              {item.description}
            </p>
          )}

          {/* Price */}
          <div className="text-lg md:text-xl font-bold text-gray-900 mt-3">
            {item.price.toLocaleString("id-ID")}
          </div>

          {/* Action Pills: Simpan (kiri) | Report & Share (kanan) - persis detail-menu-modal.png */}
          <div className="flex items-center justify-between mt-4 pt-1">
            {/* Left: Simpan */}
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`btn-press flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                isSaved
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isSaved ? "fill-rose-600 text-rose-600" : "text-gray-700"
                }`}
              />
              <span>{isSaved ? "Tersimpan" : "Simpan"}</span>
            </button>

            {/* Right: Report & Share */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert("Terima kasih. Laporan Anda telah dicatat.")}
                className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gray-700 text-white flex items-center justify-center text-[10px] font-bold">
                  !
                </div>
                <span>Report</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-700" />
                <span>{sharedToast ? "Tersalin!" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Bottom Action Button: Add to cart (Tombol hijau bulat penuh persis screenshot) */}
          <div className="mt-6 pt-1">
            <button
              type="button"
              onClick={handleAction}
              className="btn-press w-full py-3.5 px-6 rounded-full bg-[#008a00] hover:bg-[#007500] text-white font-bold text-base flex items-center justify-center shadow-sm transition-colors"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
