"use client";

import React, { useState, useEffect } from "react";
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
  ShieldCheck,
} from "lucide-react";
import { PaymentMethodChoice } from "@/types";

export default function CartClient() {
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
    removeItem,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice>("QRIS");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setErrorMessage("Silakan isi nama Anda untuk nota pemesanan.");
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

  return (
    <div className="min-h-screen bg-canvas text-ink pb-32">
      {/* Top Header - 100% Solid Opaque White */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href={`/order?table=${tableNumber}`}
            className="btn-press -ml-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
            <span>Menu</span>
          </Link>

          <h1 className="text-base font-extrabold text-gray-900 tracking-tight">
            Keranjang Pesanan
          </h1>

          <div className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            Meja {tableNumber}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
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
            <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-faint">
                  Daftar Menu ({totalItems})
                </h2>
                <Link
                  href={`/order?table=${tableNumber}`}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  + Tambah Menu Lain
                </Link>
              </div>

              <div className="space-y-3 divide-y divide-surface-border/60">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="pt-3.5 first:pt-0 flex items-start gap-3.5"
                  >
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-surface-subtle border border-surface-border shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm md:text-base text-ink leading-tight truncate">
                        {item.name}
                      </h3>

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

                      <div className="text-xs md:text-sm font-black text-brand mt-1.5">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </div>
                    </div>

                    {/* Stepper + Delete Button */}
                    <div className="flex items-center gap-2 shrink-0 self-center">
                      <button
                        type="button"
                        onClick={() =>
                          item.quantity === 1
                            ? removeItem(item.cartItemId)
                            : updateQuantity(item.cartItemId, -1)
                        }
                        className="btn-press w-7 h-7 rounded-full border border-surface-border flex items-center justify-center text-ink hover:bg-surface-subtle"
                        aria-label="Kurangi"
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
                        aria-label="Tambah"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informasi Pemesan */}
            <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-faint">
                Identitas Pemesan
              </h2>

              <div className="space-y-1.5">
                <label
                  htmlFor="customerNameFullInput"
                  className="block text-xs font-bold text-ink-secondary"
                >
                  Nama Anda untuk Nota Struk <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl bg-surface-subtle border border-surface-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-light transition-all">
                  <div className="flex items-center px-3.5 py-3 gap-2.5">
                    <User className="w-4 h-4 text-ink-muted shrink-0" />
                    <input
                      id="customerNameFullInput"
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
              <div className="space-y-1.5 pt-2 border-t border-surface-border">
                <label className="block text-xs font-bold text-ink-secondary">
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
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-faint">
                  Metode Pembayaran
                </h2>
                <span className="text-[11px] font-bold text-brand flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pay First Model
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`btn-press p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
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
                  className={`btn-press p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
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
            <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs space-y-2 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal Pesanan</span>
                <span className="font-semibold text-ink">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Pajak PB1 & Service Fee</span>
                <span className="text-emerald-700 font-bold">Rp 0 (Nett)</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm md:text-base text-ink pt-2.5 border-t border-surface-border">
                <span>Total Pembayaran</span>
                <span className="text-brand">
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Sticky Bottom Checkout Action - Solid White */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 font-medium">Total Nett</div>
              <div className="text-lg font-black text-gray-900">
                Rp {subtotal.toLocaleString("id-ID")}
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCheckout}
              className="btn-press flex-1 py-3.5 px-5 rounded-full bg-[#008a00] hover:bg-[#007500] text-white font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
