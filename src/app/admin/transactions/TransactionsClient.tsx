"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Filter,
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

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  totalAmount: number;
  createdAt: string;
  table?: {
    tableNumber: number;
  } | null;
  items: OrderItemDetail[];
}

interface TransactionsClientProps {
  initialOrders: OrderDetail[];
  userRole: string;
}

export default function TransactionsClient({
  initialOrders,
  userRole,
}: TransactionsClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>(initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");

  // Selected Order for Modal
  const [detailOrder, setDetailOrder] = useState<OrderDetail | null>(null);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      if (selectedRange !== "all") params.set("range", selectedRange);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedMethod !== "all") params.set("paymentMethod", selectedMethod);
      if (searchQuery.trim()) params.set("query", searchQuery.trim());

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.orders) {
        setOrders(json.data.orders);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter status
      if (selectedStatus !== "all" && order.status !== selectedStatus) {
        return false;
      }
      // Filter method
      if (selectedMethod !== "all" && order.paymentMethod !== selectedMethod) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = order.customerName.toLowerCase().includes(q);
        const matchNo = order.orderNumber.toLowerCase().includes(q);
        if (!matchName && !matchNo) return false;
      }
      return true;
    });
  }, [orders, selectedStatus, selectedMethod, searchQuery]);

  // Statistik
  const stats = useMemo(() => {
    const paid = filteredOrders.filter(
      (o) => o.paymentStatus === "PAID" && o.status !== "VOID"
    );
    const totalRevenue = paid.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCount = filteredOrders.length;
    const cashCount = paid.filter((o) => o.paymentMethod === "CASH").length;
    const qrisCount = paid.filter((o) => o.paymentMethod === "QRIS").length;
    return { totalRevenue, totalCount, cashCount, qrisCount };
  }, [filteredOrders]);

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === "VOID") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700">
          Dibatalkan
        </span>
      );
    }
    if (paymentStatus === "PENDING") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800">
          Belum Bayar
        </span>
      );
    }
    switch (status) {
      case "PROSES":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-700">
            Dimasak
          </span>
        );
      case "DIHIDANGKAN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700">
            Siap Saji
          </span>
        );
      case "SELESAI":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
            Lunas Selesai
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards Ringkasan Transaksi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4.5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Omzet Terbayar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-ink tracking-tight block">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </span>
            <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">
              Dari pesanan lunas
            </span>
          </div>
        </div>

        <div className="bg-surface p-4.5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-ink tracking-tight block">
              {stats.totalCount}
            </span>
            <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">
              Semua status transaksi
            </span>
          </div>
        </div>

        <div className="bg-surface p-4.5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Pembayaran Tunai
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-ink tracking-tight block">
              {stats.cashCount}
            </span>
            <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">
              Transaksi uang kas
            </span>
          </div>
        </div>

        <div className="bg-surface p-4.5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Pembayaran QRIS
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-black text-ink tracking-tight block">
              {stats.qrisCount}
            </span>
            <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">
              Transaksi non-tunai QRIS
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-surface rounded-2xl p-4 md:p-5 border border-surface-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-ink">
              Riwayat Transaksi Pesanan
            </h2>
            <p className="text-xs text-ink-muted">
              Monitoring data penjualan kasir & pesanan pelanggan secara langsung.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-surface-border hover:bg-surface-subtle text-xs font-bold text-ink transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Perbarui Data</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pelanggan / #KM..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white border border-surface-border placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Select */}
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-surface-border text-xs bg-white focus:outline-hidden focus:border-brand font-medium text-ink"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-surface-border text-xs bg-white focus:outline-hidden focus:border-brand font-medium text-ink"
          >
            <option value="all">Semua Status</option>
            <option value="SELESAI">Selesai (Lunas)</option>
            <option value="PROSES">Dimasak</option>
            <option value="DIHIDANGKAN">Siap Saji</option>
            <option value="PENDING_PAYMENT">Belum Bayar</option>
            <option value="VOID">Dibatalkan (VOID)</option>
          </select>

          {/* Payment Method Select */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-surface-border text-xs bg-white focus:outline-hidden focus:border-brand font-medium text-ink"
          >
            <option value="all">Semua Metode Bayar</option>
            <option value="CASH">Tunai (Cash)</option>
            <option value="QRIS">QRIS Dinamis</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-surface rounded-2xl border border-surface-border shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-ink-muted mx-auto" />
            <p className="text-sm font-bold text-ink">Tidak ada transaksi yang cocok</p>
            <p className="text-xs text-ink-muted">
              Coba reset filter atau ubah kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-subtle/50 text-ink-muted font-bold">
                  <th className="py-3 px-4">No. Order</th>
                  <th className="py-3 px-4">Pelanggan & Meja</th>
                  <th className="py-3 px-4 hidden md:table-cell">Menu Pesanan</th>
                  <th className="py-3 px-4">Pembayaran</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-subtle/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-ink">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[11px] text-ink-muted">{dateStr}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-ink truncate max-w-[130px]">
                            {order.customerName}
                          </span>
                          <span className="text-[11px] text-ink-muted">
                            {order.orderType === "DINE_IN"
                              ? `Meja ${order.table?.tableNumber || "-"}`
                              : "Bungkus (Takeaway)"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-ink-secondary">
                        <div className="max-w-xs truncate">
                          {order.items.map((it) => `${it.quantity}x ${it.menuItem.name}`).join(", ")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink">
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
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-ink">
                          Rp {order.totalAmount.toLocaleString("id-ID")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(order.status, order.paymentStatus)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDetailOrder(order)}
                          className="btn-press inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs font-bold text-ink hover:text-brand hover:border-brand/40 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>Lihat</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Struk Transaksi */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-surface-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 my-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand" />
                <h3 className="font-extrabold text-base text-ink">Rincian Transaksi</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Nota / Struk */}
            <div className="bg-surface-subtle/50 p-4 rounded-2xl border border-surface-border space-y-3 font-mono text-xs">
              <div className="text-center border-b border-dashed border-surface-border pb-2.5 space-y-0.5">
                <p className="font-black text-sm text-ink font-sans">Kantin Mini</p>
                <p className="text-[11px] text-ink-muted font-sans">Nota Pembayaran Transaksi</p>
                <p className="text-xs font-bold text-ink mt-1">#{detailOrder.orderNumber}</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-surface-border pb-2 text-ink-muted">
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span className="text-ink font-semibold">
                    {new Date(detailOrder.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="text-ink font-bold">{detailOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe / Meja:</span>
                  <span className="text-ink font-semibold">
                    {detailOrder.orderType === "DINE_IN"
                      ? `Makan di Meja ${detailOrder.table?.tableNumber || "-"}`
                      : "Bungkus (Takeaway)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Bayar:</span>
                  <span className="text-ink font-bold">{detailOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-1">
                {detailOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-start text-xs">
                    <div className="pr-2">
                      <span className="font-bold text-ink">
                        {it.quantity}x {it.menuItem.name}
                      </span>
                      {it.sauceOption && (
                        <span className="block text-[10px] text-brand font-semibold">
                          ({it.sauceOption})
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-ink shrink-0">
                      Rp {(it.price * it.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="border-t border-dashed border-surface-border pt-2 space-y-1">
                <div className="flex justify-between font-black text-sm text-ink">
                  <span>TOTAL:</span>
                  <span className="text-brand">
                    Rp {detailOrder.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-700">
                    {detailOrder.paymentStatus === "PAID" ? "LUNAS" : detailOrder.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-press flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="py-2.5 px-4 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
