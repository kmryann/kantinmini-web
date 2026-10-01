"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { OrderDetails } from "@/types";
import QRCode from "qrcode";
import {
  Utensils,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  CookingPot,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface StatusClientProps {
  orderId: string;
}

export default function StatusClient({ orderId }: StatusClientProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isSimulatingPay, setIsSimulatingPay] = useState<boolean>(false);

  // Fetch Order Details
  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);

        // Generate QRIS Data URL if QRIS
        if (json.data.paymentMethod === "QRIS" && json.data.qrisPayload) {
          const url = await QRCode.toDataURL(json.data.qrisPayload, {
            width: 280,
            margin: 1,
            color: { dark: "#1F1D1A", light: "#FFFFFF" },
          });
          setQrDataUrl(url);
        }

        // Calculate countdown based on expiry
        const expiresAtStr =
          json.data.qrisExpiresAt || json.data.cashExpiresAt;
        if (expiresAtStr) {
          const diffSeconds = Math.max(
            0,
            Math.floor((new Date(expiresAtStr).getTime() - Date.now()) / 1000)
          );
          setTimeLeft(diffSeconds);
        }
      } else {
        setError(json.error || "Pesanan tidak ditemukan.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kesalahan server.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Connect SSE for real-time order updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/orders/${orderId}/events`);

    eventSource.onmessage = () => {
      fetchOrder();
    };

    eventSource.addEventListener("ORDER_PAID", () => {
      fetchOrder();
    });

    eventSource.addEventListener("ORDER_STATUS_CHANGED", () => {
      fetchOrder();
    });

    eventSource.onerror = () => {
      // EventSource automatically retries
    };

    return () => {
      eventSource.close();
    };
  }, [orderId, fetchOrder]);

  // Countdown Interval
  useEffect(() => {
    if (order?.paymentStatus !== "PENDING" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order?.paymentStatus, timeLeft]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSimulatePayment = async () => {
    try {
      setIsSimulatingPay(true);
      const res = await fetch(`/api/orders/${orderId}/mock-pay`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        fetchOrder();
      } else {
        alert(json.error || "Gagal simulasi pembayaran");
      }
    } catch {
      alert("Kesalahan koneksi.");
    } finally {
      setIsSimulatingPay(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <span className="text-sm font-semibold text-ink-muted">
          Memuat status pesanan...
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-600 mb-2" />
        <h2 className="text-lg font-bold text-ink">Pesanan Tidak Ditemukan</h2>
        <p className="text-sm text-ink-muted mt-1 max-w-sm">{error}</p>
        <Link
          href="/"
          className="btn-press mt-4 px-4 py-2 rounded-xl bg-brand text-white font-bold text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const isPendingPayment = order.paymentStatus === "PENDING";
  const isPaid = order.paymentStatus === "PAID";
  const isExpired = order.paymentStatus === "EXPIRED" || timeLeft === 0;

  // 3-Dot Progress Status Calculation
  // Dot 1: Pesan (Aktif saat QRIS lunas atau Cash dikonfirmasi Kasir)
  // Dot 2: Proses (Aktif saat dapur/kasir memproses masakan)
  // Dot 3: Dihidangkan (Aktif saat hidangan siap diantar ke meja)
  const isDot1Active = isPaid || order.status !== "PENDING_PAYMENT";
  const isDot2Active =
    order.status === "PROSES" ||
    order.status === "DIHIDANGKAN" ||
    order.status === "SELESAI";
  const isDot3Active =
    order.status === "DIHIDANGKAN" || order.status === "SELESAI";

  return (
    <div className="min-h-screen bg-canvas text-ink px-4 py-6 max-w-lg mx-auto pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href={`/order?table=${order.tableNumber}`}
          className="btn-press p-2 rounded-xl bg-surface border border-surface-border text-ink hover:bg-surface-subtle transition-colors flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Menu Meja {order.tableNumber}
        </Link>

        <span className="text-xs font-mono font-bold text-ink-muted px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border">
          {order.orderNumber}
        </span>
      </div>

      {/* 3-Dot Progress Indicator Card (PRD 1.6) */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs mb-6">
        <div className="text-center mb-5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-faint">
            Pelacakan Status Pesanan
          </span>
          <h2 className="text-xl font-extrabold text-ink display-title mt-0.5">
            {order.status === "PENDING_PAYMENT"
              ? "Menunggu Pembayaran"
              : order.status === "PROSES"
              ? "Sedang Dimasak di Dapur"
              : order.status === "DIHIDANGKAN"
              ? "Hidangan Siap Disajikan"
              : order.status === "SELESAI"
              ? "Pesanan Telah Selesai"
              : "Pesanan Dibatalkan (Void)"}
          </h2>
          <p className="text-xs text-ink-muted mt-1">
            {order.status === "PENDING_PAYMENT"
              ? `Selesaikan pembayaran sebelum batas waktu berakhir.`
              : order.status === "PROSES"
              ? "Dapur sedang menyiapkan pesanan Anda dengan segar."
              : order.status === "DIHIDANGKAN"
              ? `Pesanan diantar ke Meja ${order.tableNumber}. Selamat menikmati!`
              : "Terima kasih telah berkunjung ke Kantin Mini."}
          </p>
        </div>

        {/* 3-Dot Stepper Visual - Rapi & Presisi */}
        <div className="px-4 py-3">
          {/* Circles and connector lines row */}
          <div className="flex items-center justify-between">
            {/* Dot 1 */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                isDot1Active
                  ? "bg-brand text-white shadow-xs"
                  : "bg-surface-subtle border border-surface-border text-ink-faint"
              }`}
            >
              {isDot1Active ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
            </div>

            {/* Connector Line 1 -> 2 */}
            <div className="flex-1 h-1 mx-2 bg-surface-muted rounded-full overflow-hidden">
              <div
                className={`h-full bg-brand transition-all duration-500 ${
                  isDot2Active ? "w-full" : "w-0"
                }`}
              />
            </div>

            {/* Dot 2 */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                isDot2Active
                  ? "bg-brand text-white shadow-xs"
                  : "bg-surface-subtle border border-surface-border text-ink-faint"
              }`}
            >
              {isDot2Active ? <CookingPot className="w-4 h-4" /> : "2"}
            </div>

            {/* Connector Line 2 -> 3 */}
            <div className="flex-1 h-1 mx-2 bg-surface-muted rounded-full overflow-hidden">
              <div
                className={`h-full bg-emerald-600 transition-all duration-500 ${
                  isDot3Active ? "w-full" : "w-0"
                }`}
              />
            </div>

            {/* Dot 3 */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                isDot3Active
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-surface-subtle border border-surface-border text-ink-faint"
              }`}
            >
              {isDot3Active ? <Utensils className="w-4 h-4" /> : "3"}
            </div>
          </div>

          {/* Labels row */}
          <div className="flex justify-between items-center mt-2.5">
            <span
              className={`text-[11px] font-extrabold w-12 text-center transition-colors ${
                isDot1Active ? "text-brand" : "text-ink-muted"
              }`}
            >
              Pesan
            </span>
            <span
              className={`text-[11px] font-extrabold w-12 text-center transition-colors ${
                isDot2Active ? "text-brand" : "text-ink-muted"
              }`}
            >
              Proses
            </span>
            <span
              className={`text-[11px] font-extrabold w-16 text-center transition-colors ${
                isDot3Active ? "text-emerald-700" : "text-ink-muted"
              }`}
            >
              Dihidangkan
            </span>
          </div>
        </div>
      </div>

      {/* Payment Action Box (If Pending Payment) */}
      {isPendingPayment && !isExpired && (
        <div className="bg-surface rounded-2xl p-5 border border-brand-muted/70 shadow-xs space-y-4 mb-6">
          {/* Countdown Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Selesaikan Pembayaran</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
              {formatCountdown(timeLeft)}
            </div>
          </div>

          {/* QRIS Dynamic View */}
          {order.paymentMethod === "QRIS" && (
            <div className="flex flex-col items-center text-center space-y-3">
              <span className="text-xs font-bold text-ink-secondary">
                Scan QRIS di bawah menggunakan e-Wallet / M-Banking Anda:
              </span>

              {qrDataUrl ? (
                <div className="p-3 rounded-2xl bg-white border border-surface-border shadow-xs inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Dynamic QRIS Kantin Mini"
                    className="w-56 h-56 object-contain"
                  />
                  <div className="text-[11px] font-mono text-ink-muted mt-2 font-bold">
                    Nett: Rp {order.totalAmount.toLocaleString("id-ID")}
                  </div>
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-surface-subtle rounded-2xl">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                </div>
              )}

              {/* Mock Pay Button for Testing/Demo */}
              <div className="w-full pt-2">
                <button
                  type="button"
                  disabled={isSimulatingPay}
                  onClick={handleSimulatePayment}
                  className="btn-press w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  {isSimulatingPay ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Simulasi Bayar QRIS (Demo Instan)
                </button>
                <p className="text-[10px] text-ink-faint mt-1.5">
                  Tombol ini memicu pelunasan QRIS otomatis tanpa transfer uang asli.
                </p>
              </div>
            </div>
          )}

          {/* Cash Payment View */}
          {order.paymentMethod === "CASH" && (
            <div className="flex flex-col items-center text-center space-y-3 py-2">
              <span className="text-xs font-medium text-ink-muted">
                Tunjukkan Kode Pesanan ini ke Kasir:
              </span>

              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface-subtle border-2 border-dashed border-brand/60">
                <span className="text-2xl font-black font-mono text-brand tracking-wider">
                  {order.cashCode || `#${order.orderNumber}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCode(order.cashCode || `#${order.orderNumber}`)
                  }
                  className="btn-press p-1.5 rounded-lg bg-surface text-ink-secondary hover:text-brand transition-colors"
                  title="Salin Kode"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="text-xs text-ink-muted max-w-xs leading-relaxed">
                Total yang harus dibayar:{" "}
                <span className="font-extrabold text-ink">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </span>
                . Kasir akan memverifikasi pembayaran tunai Anda.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Success Banner */}
      {isPaid && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 mb-6 shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-xs leading-snug">
            <span className="font-extrabold block">Pembayaran Lunas</span>
            Pesanan Anda telah diteruskan ke dapur dan segera disajikan.
          </div>
        </div>
      )}

      {/* Order Summary Receipt */}
      <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-faint">
          Rincian Pesanan
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-ink-muted">
            <span>Pemesan</span>
            <span className="font-bold text-ink">{order.customerName}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Lokasi Meja</span>
            <span className="font-bold text-ink">Meja {order.tableNumber}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Tipe Pesanan</span>
            <span className="font-bold text-ink">
              {order.orderType === "DINE_IN" ? "Makan di Tempat" : "Dibungkus"}
            </span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Metode Bayar</span>
            <span className="font-bold text-ink">
              {order.paymentMethod === "QRIS" ? "QRIS Dinamis" : "Tunai di Kasir"}
            </span>
          </div>
        </div>

        {/* Item Rows */}
        <div className="pt-3 border-t border-surface-border space-y-2.5">
          {order.items.map((item) => (
            <div key={item.id} className="text-xs flex justify-between items-start">
              <div>
                <span className="font-bold text-ink">
                  {item.quantity}x {item.name}
                </span>
                {item.sauceOption && (
                  <span className="block text-[11px] text-amber-800 font-semibold">
                    • Saus: {item.sauceOption}
                  </span>
                )}
                {item.notes && (
                  <span className="block text-[11px] text-ink-muted italic">
                    • &ldquo;{item.notes}&rdquo;
                  </span>
                )}
              </div>
              <span className="font-bold text-ink shrink-0 ml-2">
                Rp {(item.price * item.quantity).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        {/* Total Nett */}
        <div className="pt-3 border-t border-surface-border flex justify-between items-center">
          <span className="text-sm font-extrabold text-ink">Total Bayar (Nett)</span>
          <span className="text-base font-black text-brand">
            Rp {order.totalAmount.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Re-order Button */}
      <div className="mt-6 text-center">
        <Link
          href={`/order?table=${order.tableNumber}`}
          className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-subtle hover:bg-brand-light hover:text-brand border border-surface-border text-xs font-bold text-ink-secondary transition-colors"
        >
          <Utensils className="w-4 h-4" />
          Ingin Pesan Menu Tambahan?
        </Link>
      </div>

      {/* Help info */}
      <div className="mt-8 text-center text-xs text-ink-faint flex items-center justify-center gap-1">
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Butuh bantuan? Silakan hubungi kasir atau staf kantin.</span>
      </div>
    </div>
  );
}
