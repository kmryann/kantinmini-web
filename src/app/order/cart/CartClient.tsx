"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import {
  ArrowLeft,
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
  ShoppingBag,
  Pencil,
  X,
} from "lucide-react";
import { PaymentMethodChoice, CartItemType } from "@/types";

const emptySubscribe = () => () => {};

export default function CartClient() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    cart,
    totalItems,
    subtotal,
    customerName,
    orderType,
    tableNumber,
    setTableNumber,
    setCustomerName,
    setOrderType,
    updateQuantity,
    updateNotes,
    removeItem,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice>("QRIS");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingNotesItem, setEditingNotesItem] = useState<CartItemType | null>(null);
  const [tempNotes, setTempNotes] = useState<string>("");
  const [hasAttemptedCheckout, setHasAttemptedCheckout] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync table from query param if available
  useEffect(() => {
    const tableParam = searchParams.get("table");
    if (tableParam) {
      const parsed = parseInt(tableParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
        setTableNumber(parsed);
      }
    }
  }, [searchParams, setTableNumber]);

  // Auto-dismiss top toast error alert after 3.5 seconds
  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  const handleCheckout = async () => {
    setHasAttemptedCheckout(true);

    if (!customerName.trim()) {
      setErrorMessage("Nama pemesan wajib diisi untuk nota pemesanan.");
      nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameInputRef.current?.focus();
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("Keranjang Anda masih kosong. Silakan pilih menu terlebih dahulu.");
      return;
    }

    if (!orderType) {
      setErrorMessage("Silakan pilih tipe pesanan (Makan di Tempat atau Dibungkus).");
      return;
    }

    if (!paymentMethod) {
      setErrorMessage("Silakan pilih metode pembayaran.");
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

      // Clear local cart and navigate to order tracking page
      clearCart();
      router.push(`/order/status/${result.data.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNotes = (item: CartItemType) => {
    setEditingNotesItem(item);
    setTempNotes(item.notes || "");
  };

  const handleSaveNotes = () => {
    if (editingNotesItem) {
      updateNotes(editingNotesItem.cartItemId, tempNotes);
      setEditingNotesItem(null);
    }
  };

  // Prevent SSR/Client hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-canvas text-ink pb-32">
        <header className="sticky top-0 z-30 bg-brand text-white shadow-xs">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href={`/order?table=${tableNumber}`}
                aria-label="Kembali ke menu"
                className="btn-press -ml-1 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all flex items-center justify-center border border-white/15"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight truncate">
                Keranjang Pesanan
              </h1>
            </div>
            <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-white shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-xs font-medium text-emerald-100/90">Meja</span>
              <span className="text-sm font-extrabold text-white tracking-tight">{tableNumber}</span>
            </div>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 pt-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <span className="text-xs font-semibold text-ink-muted">Memuat keranjang pesanan...</span>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pb-32">
      {/* Top Header - Solid Brand Green */}
      <header className="sticky top-0 z-30 bg-brand text-white shadow-xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href={`/order?table=${tableNumber}`}
              aria-label="Kembali ke menu"
              className="btn-press -ml-1 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all flex items-center justify-center border border-white/15"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>

            <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight truncate">
              Keranjang Pesanan
            </h1>
          </div>

          {/* Table Number Badge - Gaya Minimalis Ikonik */}
          <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-white shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-xs font-medium text-emerald-100/90">Meja</span>
            <span className="text-sm font-extrabold text-white tracking-tight">{tableNumber}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {/* Error Alert Toast */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm font-semibold flex items-center justify-between gap-2.5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
              aria-label="Tutup pesan error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {cart.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-subtle text-ink-muted flex items-center justify-center mx-auto border border-surface-border">
              <ShoppingBag className="w-8 h-8 text-ink-faint" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-ink">Keranjang Masih Kosong</h2>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                Silakan pilih makanan dan minuman favorit Anda di menu Meja {tableNumber}.
              </p>
            </div>
            <Link
              href={`/order?table=${tableNumber}`}
              className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover transition-colors"
            >
              Lihat Daftar Menu
            </Link>
          </div>
        ) : (
          <>
            {/* List Item Pesanan */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-surface-border shadow-xs space-y-4">
              <div className="pb-3 border-b border-surface-border">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                  Daftar Menu ({totalItems})
                </h2>
              </div>

              <div className="divide-y divide-surface-border/60">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="py-4 first:pt-0 last:pb-0 space-y-3"
                  >
                    {/* Top Row: Info Teks di Kiri, Gambar di Kanan */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 pr-1">
                        <h3 className="font-bold text-[15px] md:text-base text-ink leading-snug">
                          {item.name}
                        </h3>

                        {item.sauceOption && (
                          <p className="text-xs md:text-sm text-ink-secondary mt-1">
                            <span className="font-bold text-ink">Saus :</span> {item.sauceOption}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-xs md:text-sm text-ink-secondary mt-0.5">
                            <span className="font-bold text-ink">Notes :</span> {item.notes}
                          </p>
                        )}

                        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm md:text-base font-extrabold text-ink">
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-ink-muted font-medium">
                              (@ Rp {item.price.toLocaleString("id-ID")})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Gambar Menu di Samping Kanan (sedikit lebih besar) */}
                      <div className="relative w-[100px] h-[100px] md:w-[112px] md:h-[112px] rounded-2xl overflow-hidden bg-surface shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="112px"
                          className="object-contain"
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Tombol Notes di Kiri, Quantity Stepper di Kanan (Bawah Gambar) */}
                    <div className="flex items-center justify-between gap-3 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenNotes(item)}
                        className="btn-press inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-surface-border bg-white hover:bg-surface-subtle text-xs font-bold text-ink shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-ink-secondary" />
                        <span>{item.notes ? "Edit Notes" : "Notes"}</span>
                      </button>

                      {/* Quantity Stepper Persis di Bawah Gambar dengan Spacing Lega */}
                      <div className="w-[100px] md:w-[112px] flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={() =>
                            item.quantity === 1
                              ? removeItem(item.cartItemId)
                              : updateQuantity(item.cartItemId, -1)
                          }
                          className={`btn-press w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            item.quantity === 1
                              ? "border-rose-400 text-rose-600 hover:bg-rose-50"
                              : "border-brand text-brand hover:bg-brand/10"
                          }`}
                          aria-label="Kurangi"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </button>
                        <span className="font-extrabold text-sm md:text-base text-ink tabular-nums text-center min-w-[20px]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, 1)}
                          className="btn-press w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-brand text-brand flex items-center justify-center hover:bg-brand/10 active:scale-90 transition-all cursor-pointer shrink-0"
                          aria-label="Tambah"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informasi Pemesan */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-surface-border shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                Identitas Pemesan
              </h2>

              <div className="space-y-1.5">
                <label
                  htmlFor="customerNameFullInput"
                  className="block text-xs md:text-sm font-bold text-ink"
                >
                  Nama Anda<span className="text-rose-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl bg-white border transition-all ${
                    hasAttemptedCheckout && !customerName.trim()
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                      : "border-surface-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 shadow-xs"
                  }`}
                >
                  <div className="flex items-center px-3.5 py-2.5 md:py-3 gap-2.5">
                    <User
                      className={`w-4 h-4 shrink-0 ${
                        hasAttemptedCheckout && !customerName.trim()
                          ? "text-rose-500"
                          : "text-brand"
                      }`}
                    />
                    <input
                      ref={nameInputRef}
                      id="customerNameFullInput"
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomerName(val);
                        if (errorMessage) setErrorMessage(null);
                        if (val.trim()) setHasAttemptedCheckout(false);
                      }}
                      placeholder="Masukkan nama Anda (contoh: Ryan)"
                      className="w-full bg-transparent text-sm md:text-base text-ink placeholder:text-ink-muted/50 focus:outline-hidden font-semibold"
                    />
                  </div>
                </div>
                {hasAttemptedCheckout && !customerName.trim() && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Nama pemesan wajib diisi sebelum melanjutkan.
                  </p>
                )}
              </div>

              {/* Tipe Pesanan */}
              <div className="space-y-2 pt-3 border-t border-surface-border">
                <label className="block text-xs md:text-sm font-bold text-ink">
                  Tipe Pesanan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOrderType("DINE_IN")}
                    className={`btn-press p-3 md:p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs md:text-sm font-bold transition-all ${
                      orderType === "DINE_IN"
                        ? "border-brand bg-brand/10 text-brand shadow-xs ring-1 ring-brand/30"
                        : "border-surface-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle"
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    Makan di Tempat
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("TAKEAWAY")}
                    className={`btn-press p-3 md:p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs md:text-sm font-bold transition-all ${
                      orderType === "TAKEAWAY"
                        ? "border-brand bg-brand/10 text-brand shadow-xs ring-1 ring-brand/30"
                        : "border-surface-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Dibungkus
                  </button>
                </div>
              </div>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-surface-border shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                  Metode Pembayaran
                </h2>
                
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`btn-press p-3.5 md:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    paymentMethod === "QRIS"
                      ? "border-brand bg-brand/10 text-brand shadow-xs ring-1 ring-brand/30"
                      : "border-surface-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle"
                  }`}
                >
                  <QrCode className="w-5 h-5 text-brand" />
                  <span className="text-xs md:text-sm font-bold text-ink">QRIS Dinamis</span>
                  <span className="text-[10px] md:text-[11px] text-ink-muted font-normal">
                    Verifikasi Otomatis
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`btn-press p-3.5 md:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                    paymentMethod === "CASH"
                      ? "border-brand bg-brand/10 text-brand shadow-xs ring-1 ring-brand/30"
                      : "border-surface-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle"
                  }`}
                >
                  <Banknote className="w-5 h-5 text-brand" />
                  <span className="text-xs md:text-sm font-bold text-ink">Tunai / Cash</span>
                  <span className="text-[10px] md:text-[11px] text-ink-muted font-normal">
                    Bayar di Kasir
                  </span>
                </button>
              </div>
            </div>

            {/* Rincian Harga */}
            <div className="bg-surface rounded-2xl p-4 md:p-5 border border-surface-border shadow-xs space-y-2.5 text-xs md:text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal Pesanan</span>
                <span className="font-bold text-ink">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-sm md:text-base text-ink pt-3 border-t border-surface-border">
                <span>Total Pembayaran</span>
                <span className="text-base md:text-lg font-black text-brand">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Sticky Bottom Checkout Action */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 border-t border-surface-border bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-ink-muted font-medium">Total Pembayaran</div>
              <div className="text-lg md:text-xl font-black text-ink tracking-tight">
                Rp {subtotal.toLocaleString("id-ID")}
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCheckout}
              className="btn-press flex-1 py-3 md:py-3.5 px-5 rounded-xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Bayar Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit Notes */}
      {editingNotesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="font-bold text-sm md:text-base text-ink truncate pr-2">
                Catatan: {editingNotesItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNotesItem(null)}
                className="p-1 rounded-full text-ink-muted hover:bg-surface-subtle cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Contoh: jangan pedas, bumbu dipisah, dll."
                rows={3}
                className="w-full rounded-xl border border-surface-border p-3 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none font-medium"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingNotesItem(null)}
                className="btn-press flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="btn-press flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors shadow-xs cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
