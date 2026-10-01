"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/context/CartContext";
import {
  X,
  Minus,
  Plus,
  Trash2,
  QrCode,
  Banknote,
  UtensilsCrossed,
  Package,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PaymentMethodChoice } from "@/types";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const {
    cart,
    totalItems,
    subtotal,
    customerName,
    orderType,
    tableNumber,
    setCustomerName,
    setOrderType,
    updateQuantity,
    removeItem,
    clearCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice>("QRIS");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setErrorMessage("Silakan isi nama Anda untuk nota pesanan.");
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("Keranjang Anda masih kosong.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          customerName: customerName.trim(),
          orderType,
          paymentMethod,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            sauceOption: item.sauceOption,
            notes: item.notes,
          })),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Gagal memproses pesanan.");
      }

      // Clear local cart and navigate to tracking page
      clearCart();
      setIsCartDrawerOpen(false);
      router.push(`/order/status/${result.data.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setIsCartDrawerOpen(false)}
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
          />

          {/* Spring Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
          >
            {/* Grab Handle */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-surface-muted/90" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-ink">Keranjang Pesanan</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-light text-brand border border-brand-muted/40">
                  Meja {tableNumber}
                </span>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsCartDrawerOpen(false)}
                className="btn-press p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
                aria-label="Tutup keranjang"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto px-5 py-4 space-y-6 flex-1">
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-faint">
                  Daftar Menu ({totalItems})
                </h3>

                {cart.length === 0 ? (
                  <div className="py-8 text-center text-ink-muted text-sm">
                    Keranjang Anda masih kosong.
                  </div>
                ) : (
                  <div className="space-y-3 divide-y divide-surface-border/60">
                    {cart.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="pt-3 first:pt-0 flex items-start gap-3"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-subtle border border-surface-border shrink-0">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink leading-tight truncate">
                            {item.name}
                          </h4>

                          {item.sauceOption && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/50">
                              Saus: {item.sauceOption}
                            </span>
                          )}

                          {item.notes && (
                            <p className="text-[11px] text-ink-muted italic mt-0.5 line-clamp-1">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          )}

                          <div className="text-xs font-extrabold text-brand mt-1.5">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </div>
                        </div>

                        {/* Stepper + Delete */}
                        <div className="flex items-center gap-2 shrink-0 self-center">
                          <button
                            type="button"
                            onClick={() =>
                              item.quantity === 1
                                ? removeItem(item.cartItemId)
                                : updateQuantity(item.cartItemId, -1)
                            }
                            className="btn-press w-7 h-7 rounded-full border border-surface-border flex items-center justify-center text-ink hover:bg-surface-subtle"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="font-bold text-xs text-ink w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                            className="btn-press w-7 h-7 rounded-full border border-brand text-brand flex items-center justify-center hover:bg-brand-light"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Name Input */}
              <div className="space-y-1.5 pt-2 border-t border-surface-border">
                <label
                  htmlFor="customerNameInput"
                  className="block text-xs font-extrabold uppercase tracking-wider text-ink-secondary"
                >
                  Nama Pemesan <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl bg-surface-subtle border border-surface-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-light transition-all">
                  <div className="flex items-center px-3 py-2.5 gap-2.5">
                    <User className="w-4 h-4 text-ink-muted shrink-0" />
                    <input
                      id="customerNameInput"
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Masukkan nama Anda (contoh: Ryan)"
                      className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Tipe Pesanan */}
              <div className="space-y-2 pt-2 border-t border-surface-border">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-secondary">
                  Tipe Pesanan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOrderType("DINE_IN")}
                    className={`btn-press p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      orderType === "DINE_IN"
                        ? "border-brand bg-brand-light text-brand shadow-xs"
                        : "border-surface-border bg-surface text-ink-muted hover:bg-surface-subtle"
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    Makan di Tempat
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("TAKEAWAY")}
                    className={`btn-press p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      orderType === "TAKEAWAY"
                        ? "border-brand bg-brand-light text-brand shadow-xs"
                        : "border-surface-border bg-surface text-ink-muted hover:bg-surface-subtle"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Dibungkus
                  </button>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="space-y-2 pt-2 border-t border-surface-border">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-ink-secondary">
                    Metode Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-brand">
                    Pay First Model
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("QRIS")}
                    className={`btn-press p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                      paymentMethod === "QRIS"
                        ? "border-brand bg-brand-light text-brand shadow-xs"
                        : "border-surface-border bg-surface text-ink-muted hover:bg-surface-subtle"
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs font-bold">QRIS Dinamis</span>
                    <span className="text-[10px] text-ink-muted font-normal">
                      Verifikasi Otomatis
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`btn-press p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                      paymentMethod === "CASH"
                        ? "border-brand bg-brand-light text-brand shadow-xs"
                        : "border-surface-border bg-surface text-ink-muted hover:bg-surface-subtle"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs font-bold">Tunai / Cash</span>
                    <span className="text-[10px] text-ink-muted font-normal">
                      Bayar di Kasir
                    </span>
                  </button>
                </div>
              </div>

              {/* Rincian Harga Nett */}
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border space-y-1.5 text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal Item</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Pajak PB1 & Service</span>
                  <span className="text-emerald-700 font-bold">Rp 0 (Nett)</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-ink pt-1.5 border-t border-surface-border">
                  <span>Total Pembayaran</span>
                  <span className="text-brand">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Bottom Checkout CTA */}
            <div className="p-4 border-t border-surface-border bg-surface">
              <button
                type="button"
                disabled={isSubmitting || cart.length === 0}
                onClick={handleCheckout}
                className="btn-press w-full py-3.5 px-5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses Pesanan...
                  </>
                ) : (
                  <>
                    Bayar Sekarang • Rp {subtotal.toLocaleString("id-ID")}
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
