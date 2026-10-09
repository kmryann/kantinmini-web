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
  Download,
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

  // Bersihkan keranjang belanja di localStorage saat tiba di halaman status pesanan
  useEffect(() => {
    try {
      localStorage.removeItem("kantinmini_cart");
    } catch {
      // ignore
    }
  }, []);

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
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();
        if (ignore) return;
        if (json.success && json.data) {
          setOrder(json.data);
          if (json.data.paymentMethod === "QRIS" && json.data.qrisPayload) {
            const url = await QRCode.toDataURL(json.data.qrisPayload, {
              width: 280,
              margin: 1,
              color: { dark: "#1F1D1A", light: "#FFFFFF" },
            });
            setQrDataUrl(url);
          }
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
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Kesalahan server.";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [orderId]);

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

  const handleDownloadQR = () => {
    if (!qrDataUrl || !order) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QRIS-KantinMini-${order.orderNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink pb-20">
        <header className="sticky top-0 z-30 bg-brand text-white shadow-xs">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
              Status Pesanan
            </h1>
            <div className="w-16 h-7 rounded-lg bg-white/20 animate-pulse" />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 pt-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <span className="text-xs font-semibold text-ink-muted">
            Memuat status pesanan...
          </span>
        </main>
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
    <div className="min-h-screen bg-canvas text-ink pb-20">
      {/* Top Header - Solid Brand Green, No Back Button */}
      <header className="sticky top-0 z-30 bg-brand text-white shadow-xs">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
              Status Pesanan
            </h1>
            <span className="text-[11px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-md">
              #{order.orderNumber}
            </span>
          </div>

          {/* Table Indicator - Minimalis Ikonik */}
          <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-white shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-xs font-medium text-emerald-100/90">Meja</span>
            <span className="text-sm font-extrabold text-white tracking-tight">{order.tableNumber}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Status Stepper Card */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs">
          <div className="text-center mb-4">
            <h2 className="text-lg md:text-xl font-extrabold text-ink">
              {order.status === "PENDING_PAYMENT"
                ? "Menunggu Pembayaran"
                : order.status === "PROSES"
                ? "Sedang Dimasak"
                : order.status === "DIHIDANGKAN"
                ? "Pesanan Siap Disajikan"
                : order.status === "SELESAI"
                ? "Pesanan Selesai"
                : "Pesanan Dibatalkan"}
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              {order.status === "PENDING_PAYMENT"
                ? "Selesaikan pembayaran sebelum batas waktu berakhir"
                : order.status === "PROSES"
                ? "Dapur sedang menyiapkan pesanan Anda"
                : order.status === "DIHIDANGKAN"
                ? `Pesanan diantar ke Meja ${order.tableNumber}`
                : "Terima kasih telah berkunjung ke Kantin Mini"}
            </p>
          </div>

          {/* 3-Dot Stepper */}
          <div className="px-2 py-2">
            <div className="relative flex items-start justify-between">
              {/* Connector 1 -> 2 */}
              <div className="absolute left-[36px] right-1/2 top-[18px] -translate-y-1/2 h-1 bg-surface-border rounded-full overflow-hidden">
                <div
                  className={`h-full bg-brand transition-all duration-500 ${
                    isDot2Active ? "w-full" : "w-0"
                  }`}
                />
              </div>

              {/* Connector 2 -> 3 */}
              <div className="absolute left-1/2 right-[36px] top-[18px] -translate-y-1/2 h-1 bg-surface-border rounded-full overflow-hidden">
                <div
                  className={`h-full bg-brand transition-all duration-500 ${
                    isDot3Active ? "w-full" : "w-0"
                  }`}
                />
              </div>

              {/* Step 1: Pesan */}
              <div className="relative z-10 flex flex-col items-center w-[72px] text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isDot1Active
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface border border-surface-border text-ink-muted"
                  }`}
                >
                  {isDot1Active ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 ${
                    isDot1Active ? "text-brand" : "text-ink-muted"
                  }`}
                >
                  Pesan
                </span>
              </div>

              {/* Step 2: Masak */}
              <div className="relative z-10 flex flex-col items-center w-[72px] text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isDot2Active
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface border border-surface-border text-ink-muted"
                  }`}
                >
                  {isDot2Active ? <CookingPot className="w-4 h-4" /> : "2"}
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 ${
                    isDot2Active ? "text-brand" : "text-ink-muted"
                  }`}
                >
                  Masak
                </span>
              </div>

              {/* Step 3: Siap */}
              <div className="relative z-10 flex flex-col items-center w-[72px] text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isDot3Active
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface border border-surface-border text-ink-muted"
                  }`}
                >
                  {isDot3Active ? <Utensils className="w-4 h-4" /> : "3"}
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 ${
                    isDot3Active ? "text-brand" : "text-ink-muted"
                  }`}
                >
                  Siap
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QRIS Payment Box */}
        {isPendingPayment && !isExpired && order.paymentMethod === "QRIS" && (
          <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs text-center space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Batas Pembayaran</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
                {formatCountdown(timeLeft)}
              </div>
            </div>

            {qrDataUrl ? (
              <div className="space-y-3">
                <div className="inline-block p-3 rounded-2xl bg-white border border-surface-border shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QRIS Kantin Mini"
                    className="w-56 h-56 object-contain mx-auto"
                  />
                  <div className="text-xs font-extrabold text-ink mt-2">
                    Total: Rp {order.totalAmount.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Tombol Unduh QR */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-brand" />
                    <span>Unduh QR</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-surface-subtle rounded-2xl mx-auto">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              </div>
            )}

            {/* Mock pay demo button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSimulatingPay}
                onClick={handleSimulatePayment}
                className="btn-press w-full py-2.5 px-4 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isSimulatingPay ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Simulasi Bayar QRIS (Demo)</span>
              </button>
            </div>
          </div>
        )}

        {/* Cash Payment Box */}
        {isPendingPayment && !isExpired && order.paymentMethod === "CASH" && (
          <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs text-center space-y-3">
            <span className="text-xs font-medium text-ink-muted">
              Tunjukkan Kode ke Kasir:
            </span>

            <div className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-surface-subtle border-2 border-dashed border-brand/50 max-w-xs mx-auto">
              <span className="text-2xl font-black font-mono text-brand tracking-wider">
                {order.cashCode || `#${order.orderNumber}`}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(order.cashCode || `#${order.orderNumber}`)}
                className="btn-press p-1.5 rounded-lg bg-surface text-ink hover:text-brand transition-colors cursor-pointer"
                title="Salin Kode"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-brand" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="text-xs text-ink-muted">
              Total Bayar: <span className="font-extrabold text-ink">Rp {order.totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        {/* Payment Success Banner */}
        {isPaid && (
          <div className="p-4 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-xs font-bold leading-snug">
              Pembayaran Berhasil — Pesanan sedang disiapkan di dapur.
            </div>
          </div>
        )}

        {/* Order Summary Receipt */}
        <div className="bg-surface rounded-2xl p-5 border border-surface-border shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
            Rincian Pesanan
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Pemesan</span>
              <span className="font-bold text-ink">{order.customerName}</span>
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
                <div className="pr-2">
                  <span className="font-bold text-ink">
                    {item.quantity}x {item.name}
                  </span>
                  {item.sauceOption && (
                    <span className="block text-[11px] text-ink-muted">
                      Saus: {item.sauceOption}
                    </span>
                  )}
                  {item.notes && (
                    <span className="block text-[11px] text-ink-muted italic">
                      &ldquo;{item.notes}&rdquo;
                    </span>
                  )}
                </div>
                <span className="font-bold text-ink shrink-0">
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-surface-border flex justify-between items-center">
            <span className="text-sm font-extrabold text-ink">Total Pembayaran</span>
            <span className="text-base font-black text-brand">
              Rp {order.totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Order More Link */}
        <div className="text-center pt-2">
          <Link
            href={`/order?table=${order.tableNumber}`}
            className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle active:scale-95 transition-all shadow-2xs"
          >
            <Utensils className="w-3.5 h-3.5 text-brand" />
            <span>Pesan Menu Lain</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
