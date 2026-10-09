"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChefHat,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CreditCard,
  Utensils,
  Check,
  X,
  Printer,
  ChevronRight,
  Filter,
  Sparkles,
  Loader2,
  ShoppingBag,
} from "lucide-react";

export interface OrderItemDetail {
  id: string;
  quantity: number;
  price: number;
  sauceOption?: string | null;
  notes?: string | null;
  menuItem: {
    name: string;
  };
}

export interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string; // PENDING_PAYMENT, PROSES, DIHIDANGKAN, SELESAI, VOID
  paymentMethod: string; // CASH, QRIS
  paymentStatus: string; // PENDING, PAID, CANCELLED
  subtotal: number;
  totalAmount: number;
  cashCode?: string | null;
  createdAt: string;
  table?: {
    tableNumber: number;
  } | null;
  items: OrderItemDetail[];
}

interface CashierOrdersClientProps {
  initialOrders: OrderData[];
  userRole: string;
}

export default function CashierOrdersClient({
  initialOrders,
}: CashierOrdersClientProps) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"active" | "all" | "pending_payment" | "proses" | "dihidangkan">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Detail Modal & Void Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [voidModalOrder, setVoidModalOrder] = useState<OrderData | null>(null);
  const [voidReason, setVoidReason] = useState("");

  // Fetch orders from API
  const fetchOrders = useCallback(async (tab = activeTab, query = searchQuery) => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      params.set("filter", tab);
      if (query.trim()) params.set("query", query.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat pesanan:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  // Real-time updates via Server-Sent Events (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/admin/orders/events");

      eventSource.onmessage = () => {
        fetchOrders();
      };

      eventSource.addEventListener("ORDER_CREATED", () => {
        fetchOrders();
      });

      eventSource.addEventListener("ORDER_PAID", () => {
        fetchOrders();
      });

      eventSource.addEventListener("ORDER_STATUS_CHANGED", () => {
        fetchOrders();
      });

      eventSource.onerror = () => {
        // EventSource otomatis mencoba reconnect
      };
    } catch (err) {
      console.error("SSE connection error:", err);
    }

    // Fallback polling setiap 10 detik jika SSE terputus/jaringan terbatas
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchOrders]);

  // Handle Order Action (Payment confirmation, workflow steps)
  const handleOrderAction = async (orderId: string, action: string, reason?: string) => {
    try {
      setActionLoadingId(orderId);
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action,
          voidReason: reason,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Gagal memperbarui status pesanan.");
        return;
      }

      // Update state order lokal
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? json.data : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(json.data);
      }

      // Refresh data agar tab aktif sinkron
      await fetchOrders();
    } catch (err) {
      console.error("Error executing order action:", err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoadingId(null);
      setVoidModalOrder(null);
      setVoidReason("");
    }
  };

  // Filtered orders by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.cashCode && o.cashCode.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      active: orders.filter((o) => ["PENDING_PAYMENT", "PROSES", "DIHIDANGKAN"].includes(o.status)).length,
      pendingPayment: orders.filter((o) => o.paymentStatus === "PENDING" && o.status !== "VOID").length,
      proses: orders.filter((o) => o.status === "PROSES").length,
      dihidangkan: orders.filter((o) => o.status === "DIHIDANGKAN").length,
    };
  }, [orders]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-brand" />
            <span>Pesanan Masuk</span>
          </h1>
          <p className="text-xs md:text-sm text-ink-muted mt-0.5">
            Pantau pesanan meja, verifikasi pembayaran kasir, dan kelola antrean dapur.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={isRefreshing}
            className="btn-press inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-xs font-bold text-ink hover:text-brand hover:border-brand/40 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-2 rounded-2xl border border-surface-border shadow-2xs">
        {/* Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("active");
              fetchOrders("active");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "active"
                ? "bg-brand text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
            }`}
          >
            <span>Semua Aktif</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === "active" ? "bg-white/20 text-white" : "bg-surface-subtle text-ink-muted border border-surface-border"
            }`}>
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("pending_payment");
              fetchOrders("pending_payment");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pending_payment"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
            }`}
          >
            <span>Belum Bayar</span>
            {counts.pendingPayment > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === "pending_payment" ? "bg-white text-amber-600" : "bg-amber-100 text-amber-700"
              }`}>
                {counts.pendingPayment}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("proses");
              fetchOrders("proses");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "proses"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
            }`}
          >
            <span>Sedang Dimasak</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === "proses" ? "bg-white/20 text-white" : "bg-surface-subtle text-ink-muted border border-surface-border"
            }`}>
              {counts.proses}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("dihidangkan");
              fetchOrders("dihidangkan");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "dihidangkan"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
            }`}
          >
            <span>Siap / Dihidangkan</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === "dihidangkan" ? "bg-white/20 text-white" : "bg-surface-subtle text-ink-muted border border-surface-border"
            }`}>
              {counts.dihidangkan}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Cari Meja / Nama / No. Nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-subtle/60 border border-surface-border rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-hidden focus:border-brand"
          />
        </div>
      </div>

      {/* Orders Grid / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-surface-border p-12 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center mx-auto text-ink-faint">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-ink">Tidak Ada Pesanan</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
              Saat ini tidak ada pesanan pada kategori filter ini. Pesanan baru dari meja akan muncul otomatis di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isLoadingThis = actionLoadingId === order.id;
            const isUnpaidCash = order.paymentMethod === "CASH" && order.paymentStatus === "PENDING";
            const orderTime = new Date(order.createdAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className={`bg-surface rounded-2xl border transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  isUnpaidCash
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : order.status === "DIHIDANGKAN"
                    ? "border-emerald-200"
                    : "border-surface-border"
                }`}
              >
                {/* Header Kartu */}
                <div className="p-4 border-b border-surface-border space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-ink font-mono">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[11px] text-ink-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {orderTime}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-ink mt-0.5 truncate max-w-[180px]">
                        {order.customerName}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-surface-subtle border border-surface-border font-extrabold text-xs text-brand">
                        {order.orderType === "DINE_IN"
                          ? `Meja ${order.table?.tableNumber || "-"}`
                          : "Bungkus"}
                      </span>
                    </div>
                  </div>

                  {/* Payment & Status Badges */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-secondary">
                      {order.paymentMethod === "CASH" ? (
                        <>
                          <Banknote className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tunai</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                          <span>QRIS</span>
                        </>
                      )}
                      <span>•</span>
                      <span
                        className={`font-black ${
                          order.paymentStatus === "PAID"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {order.paymentStatus === "PAID" ? "Lunas" : "Belum Bayar"}
                      </span>
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        order.status === "PROSES"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : order.status === "DIHIDANGKAN"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : order.status === "SELESAI"
                          ? "bg-zinc-100 text-zinc-700 border border-zinc-200"
                          : order.status === "VOID"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {order.status === "PENDING_PAYMENT"
                        ? "Menunggu Bayar"
                        : order.status === "PROSES"
                        ? "Dimasak"
                        : order.status === "DIHIDANGKAN"
                        ? "Dihidangkan"
                        : order.status}
                    </span>
                  </div>
                </div>

                {/* List Menu Items */}
                <div className="p-4 space-y-2 flex-1">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs flex justify-between items-start border-b border-surface-border/40 pb-1.5 last:border-0 last:pb-0"
                      >
                        <div className="pr-2">
                          <span className="font-extrabold text-ink">
                            {item.quantity}x {item.menuItem.name}
                          </span>
                          {item.sauceOption && (
                            <span className="block text-[11px] text-brand font-semibold">
                              Saus: {item.sauceOption}
                            </span>
                          )}
                          {item.notes && (
                            <span className="block text-[11px] text-amber-700 italic">
                              Catatan: &ldquo;{item.notes}&rdquo;
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-ink-muted shrink-0 text-[11px]">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-surface-border flex justify-between items-baseline font-bold">
                    <span className="text-xs text-ink-muted">Total Pembayaran:</span>
                    <span className="text-sm font-black text-brand">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-surface-subtle/50 border-t border-surface-border rounded-b-2xl space-y-2">
                  {/* Warning Belum Bayar Tunai */}
                  {isUnpaidCash && (
                    <button
                      type="button"
                      disabled={isLoadingThis}
                      onClick={() => handleOrderAction(order.id, "CONFIRM_PAYMENT")}
                      className="btn-press w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Banknote className="w-3.5 h-3.5" />
                      )}
                      <span>Konfirmasi Terima Uang Tunai</span>
                    </button>
                  )}

                  {/* Tombol Perubahan Workflow Dapur */}
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === "PENDING_PAYMENT" ? (
                      order.paymentMethod === "QRIS" && order.paymentStatus !== "PAID" ? (
                        <button
                          type="button"
                          disabled
                          title="Pesanan QRIS wajib lunas sebelum dimasak (Payfirst)"
                          className="py-2 px-2 rounded-xl bg-surface-subtle border border-surface-border text-ink-faint font-bold text-xs flex items-center justify-center gap-1 cursor-not-allowed opacity-70"
                        >
                          <Utensils className="w-3 h-3 text-ink-faint" />
                          <span>Tunggu Bayar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleOrderAction(order.id, "SET_PROSES")}
                          className="btn-press py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Utensils className="w-3 h-3" />
                          <span>Mulai Masak</span>
                        </button>
                      )
                    ) : order.status === "PROSES" ? (
                      <button
                        type="button"
                        disabled={isLoadingThis}
                        onClick={() => handleOrderAction(order.id, "SET_DIHIDANGKAN")}
                        className="btn-press py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" />
                        <span>Siap Saji</span>
                      </button>
                    ) : order.status === "DIHIDANGKAN" ? (
                      <button
                        type="button"
                        disabled={isLoadingThis}
                        onClick={() => handleOrderAction(order.id, "SET_SELESAI")}
                        className="btn-press py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Selesaikan</span>
                      </button>
                    ) : null}

                    {/* Tombol Rincian / Detail */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="py-2 px-2 rounded-xl bg-surface border border-surface-border text-ink hover:text-brand font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>Rincian Nota</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Tombol Batalkan / Void */}
                  {order.status !== "SELESAI" && order.status !== "VOID" && (
                    <div className="text-right pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setVoidModalOrder(order);
                          setVoidReason("");
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Batalkan Pesanan (Void)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Nota */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-surface-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-brand" />
                <h3 className="font-extrabold text-base text-ink">Detail Pesanan Meja</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-surface-subtle/50 p-4 rounded-2xl border border-surface-border space-y-3 font-mono text-xs">
              <div className="text-center border-b border-dashed border-surface-border pb-2.5">
                <p className="font-black text-sm text-ink font-sans">Kantin Mini</p>
                <p className="text-xs font-bold text-ink mt-1">#{selectedOrder.orderNumber}</p>
                {selectedOrder.cashCode && (
                  <p className="text-[11px] font-bold text-amber-700 font-sans mt-0.5">
                    Kode Kasir: {selectedOrder.cashCode}
                  </p>
                )}
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-surface-border pb-2 text-ink-muted">
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span className="text-ink font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="text-ink font-bold">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe / Meja:</span>
                  <span className="text-ink font-semibold">
                    {selectedOrder.orderType === "DINE_IN"
                      ? `Makan di Meja ${selectedOrder.table?.tableNumber || "-"}`
                      : "Bungkus (Takeaway)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Bayar:</span>
                  <span className="text-ink font-bold">{selectedOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-1.5 py-1">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-start text-xs">
                    <div className="pr-2">
                      <span className="font-bold text-ink">
                        {it.quantity}x {it.menuItem.name}
                      </span>
                      {it.sauceOption && (
                        <span className="block text-[10px] text-brand font-semibold">
                          Saus: {it.sauceOption}
                        </span>
                      )}
                      {it.notes && (
                        <span className="block text-[10px] text-amber-700 italic">
                          Notes: &ldquo;{it.notes}&rdquo;
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-ink shrink-0">
                      Rp {(it.price * it.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-surface-border pt-2 space-y-1">
                <div className="flex justify-between font-black text-sm text-ink">
                  <span>TOTAL:</span>
                  <span className="text-brand">
                    Rp {selectedOrder.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Status Bayar:</span>
                  <span className={`font-bold ${
                    selectedOrder.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {selectedOrder.paymentStatus === "PAID" ? "LUNAS" : "BELUM LUNAS"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Status Masak:</span>
                  <span className="font-bold text-ink">{selectedOrder.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {selectedOrder.paymentStatus === "PAID" ? (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-press flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Nota Dapur</span>
                </button>
              ) : (
                <div className="flex-1 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold text-center">
                  Nota dapat dicetak setelah pesanan lunas
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-4 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembatalan (Void) */}
      {voidModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface rounded-3xl border border-surface-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-base text-ink">Batalkan Pesanan (Void)?</h3>
            </div>

            <p className="text-xs text-ink-muted">
              Anda akan membatalkan pesanan <span className="font-bold text-ink">#{voidModalOrder.orderNumber}</span> ({voidModalOrder.customerName}).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">Alasan Pembatalan:</label>
              <textarea
                rows={3}
                placeholder="Misal: Pelanggan membatalkan pesanan / salah pilih menu..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full p-2.5 bg-surface-subtle/50 border border-surface-border rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={!voidReason.trim() || actionLoadingId === voidModalOrder.id}
                onClick={() => handleOrderAction(voidModalOrder.id, "SET_VOID", voidReason)}
                className="btn-press flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionLoadingId === voidModalOrder.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>Konfirmasi Void</span>
              </button>

              <button
                type="button"
                onClick={() => setVoidModalOrder(null)}
                className="py-2.5 px-3.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
