"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MenuItemType } from "@/types";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { ArrowLeft, Check, Minus, Plus, MessageSquare } from "lucide-react";

interface CustomizeModalProps {
  item: MenuItemType | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    item: MenuItemType,
    quantity: number,
    sauceOption: string,
    notes?: string
  ) => void;
}

const DEFAULT_SAUCE_OPTIONS = [
  { id: "bbq", label: "Saus BBQ", price: 0 },
  { id: "blackpepper", label: "Saus Blackpepper", price: 0 },
  { id: "teriyaki", label: "Saus Teriyaki", price: 0 },
  { id: "sambal_matah", label: "Sambal Matah", price: 0 },
];

const parseOptions = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((s) => String(s).trim()).filter(Boolean);
    }
  } catch {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

interface CustomizeSheetContentProps {
  item: MenuItemType;
  onClose: () => void;
  onAddToCart: (
    item: MenuItemType,
    quantity: number,
    sauceOption: string,
    notes?: string
  ) => void;
}

const CustomizeSheetContent: React.FC<CustomizeSheetContentProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const modifierTitle = item.modifierName?.trim() || "PILIHAN SAUS";

  const options = React.useMemo(() => {
    const parsed = parseOptions(item.modifierOptions);
    if (parsed.length > 0) {
      return parsed.map((label, idx) => ({ id: `opt-${idx}`, label, price: 0 }));
    }
    return DEFAULT_SAUCE_OPTIONS;
  }, [item.modifierOptions]);

  const [selectedOption, setSelectedOption] = useState<string>(() => {
    const parsed = parseOptions(item.modifierOptions);
    return parsed.length > 0 ? parsed[0] : (DEFAULT_SAUCE_OPTIONS[0]?.label || "Saus BBQ");
  });

  const [notes, setNotes] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const totalCalculated = item.price * quantity;

  const handleConfirm = () => {
    onAddToCart(item, quantity, selectedOption, notes);
    onClose();
  };

  return (
    <>
      {/* Grab Handle */}
      <div className="pt-3 pb-1 flex justify-center sm:hidden shrink-0">
        <div className="w-12 h-1.5 rounded-full bg-surface-muted/90" />
      </div>

      {/* Top Bar Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-surface-border shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="btn-press p-1.5 rounded-full text-ink hover:bg-surface-subtle -ml-1 transition-colors cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base md:text-lg font-bold text-ink">
          Kustomisasi Menu
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto px-5 py-4 space-y-6 flex-1">
        {/* Item Header Banner */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-base md:text-lg font-black text-ink tracking-tight uppercase">
              {item.name}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Pilih {modifierTitle.toLowerCase()} dan tambahkan instruksi khusus jika ada.
            </p>
          </div>
          <span className="text-base md:text-lg font-bold text-ink shrink-0">
            {item.price.toLocaleString("id-ID")}
          </span>
        </div>

        {/* Dynamic Modifier Section */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                {modifierTitle}
              </h4>
            </div>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">
              Wajib <span className="text-ink-muted font-normal">• Pilih 1 opsi</span>
            </p>
          </div>

          <div className="space-y-1 divide-y divide-surface-border/60">
            {options.map((opt) => {
              const isChecked = selectedOption === opt.label;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.label)}
                  className="btn-press flex items-center justify-between py-3.5 px-2 rounded-xl cursor-pointer hover:bg-surface-subtle/50 transition-colors"
                >
                  <span className="font-semibold text-sm text-ink uppercase tracking-wide">
                    {opt.label}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-ink-muted">
                      {opt.price === 0 ? "Free" : `+${opt.price.toLocaleString("id-ID")}`}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? "border-brand bg-brand text-white"
                          : "border-ink-faint/60 bg-surface"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-2 pt-2 border-t border-surface-border">
          <div>
            <h4 className="text-sm font-extrabold text-ink">Notes</h4>
            <p className="text-xs text-ink-muted">Optional</p>
          </div>

          <div className="relative rounded-2xl bg-surface-subtle border border-surface-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-light transition-all p-3">
            <div className="flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                rows={2}
                placeholder="Write special requests here (e.g. saus dipisah, tanpa garnish)..."
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-hidden resize-none leading-relaxed"
              />
            </div>
            <div className="text-right text-[11px] text-ink-faint font-medium mt-1">
              {notes.length}/200
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 border-t border-surface-border bg-surface space-y-3 shrink-0">
        {/* Stepper Quantity */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Item quantity</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="btn-press w-8 h-8 rounded-full border border-surface-border flex items-center justify-center text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-subtle"
              aria-label="Kurangi jumlah"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-base text-ink w-6 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="btn-press w-8 h-8 rounded-full border border-brand text-brand flex items-center justify-center hover:bg-brand-light"
              aria-label="Tambah jumlah"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Submit Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="btn-press w-full py-3.5 px-5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm md:text-base flex items-center justify-center shadow-md transition-colors"
        >
          Add to cart - {totalCalculated.toLocaleString("id-ID")}
        </button>
      </div>
    </>
  );
};

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  // Prevent background scrolling when customize modal is open
  useBodyScrollLock(Boolean(isOpen && item));

  return (
    <AnimatePresence>
      {isOpen && item && (
        <div
          key="customize-modal-overlay"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
        >
          {/* Backdrop Scrim */}
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
            className="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
          >
            <CustomizeSheetContent
              key={item.id}
              item={item}
              onClose={onClose}
              onAddToCart={onAddToCart}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
