"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShoppingBag,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  ChefHat,
  ArrowRight,
  RefreshCw,
  Store,
  Receipt,
  PlusCircle,
  CreditCard,
  Banknote,
} from "lucide-react";

interface RecentOrderType {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  table?: {
    tableNumber: number;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    sauceOption?: string | null;
    menuItem: {
      name: string;
    };
  }>;
}

interface DashboardData {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    paidOrdersCount: number;
    totalMenuItems: number;
    availableMenuItems: number;
    totalCategories: number;
    pendingPaymentOrders: number;
    inCookingOrders: number;
    readyOrders: number;
    completedOrders: number;
  };
  recentOrders: RecentOrderType[];
}

export default function AdminDashboardClient({
  data,
  basePath = "/admin",
}: {
  data: DashboardData;
  basePath?: string;
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const { stats, recentOrders } = data;

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
            Selesai
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

  return (
    <div className="space-y-6">
      {/* Top Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">
          Ringkasan omzet, status antrean pesanan, dan menu aktif kantin
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-ink transition-all cursor-pointer shadow-2xs"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/transactions"
            className="btn-press inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Laporan Transaksi</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Total Omzet
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-ink tracking-tight block">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-ink-muted font-medium mt-1 block">
              Dari {stats.paidOrdersCount} transaksi sukses
            </span>
          </div>
        </div>

        {/* Card 2: Total Pesanan */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Total Pesanan
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-ink tracking-tight block">
              {stats.totalOrders}
            </span>
            <span className="text-xs text-ink-muted font-medium mt-1 block">
              {stats.completedOrders} selesai disajikan
            </span>
          </div>
        </div>

        {/* Card 3: Antrean Masak & Saji */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Antrean Dapur
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-amber-600 tracking-tight block">
              {stats.inCookingOrders + stats.readyOrders}
            </span>
            <span className="text-xs text-ink-muted font-medium mt-1 block">
              {stats.inCookingOrders} dimasak &bull; {stats.readyOrders} siap saji
            </span>
          </div>
        </div>

        {/* Card 4: Katalog Menu */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Katalog Menu
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-ink tracking-tight block">
              {stats.availableMenuItems}{" "}
              <span className="text-sm font-bold text-ink-muted">
                / {stats.totalMenuItems}
              </span>
            </span>
            <span className="text-xs text-ink-muted font-medium mt-1 block">
              Dalam {stats.totalCategories} kategori menu
            </span>
          </div>
        </div>
      </div>

      {/* Operational Pipeline Tracker */}
      <div className="bg-surface p-5 md:p-6 rounded-2xl border border-surface-border shadow-xs space-y-4">
        <h2 className="text-sm font-black text-ink uppercase tracking-wider">
          Alur Pesanan Aktif
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Menunggu Bayar</span>
            </div>
            <span className="text-xl font-black text-amber-900 mt-2 block">
              {stats.pendingPaymentOrders}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60">
            <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
              <ChefHat className="w-4 h-4 text-blue-600" />
              <span>Sedang Dimasak</span>
            </div>
            <span className="text-xl font-black text-blue-900 mt-2 block">
              {stats.inCookingOrders}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/60">
            <div className="flex items-center gap-2 text-purple-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>Siap Dihidangkan</span>
            </div>
            <span className="text-xl font-black text-purple-900 mt-2 block">
              {stats.readyOrders}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Selesai</span>
            </div>
            <span className="text-xl font-black text-emerald-900 mt-2 block">
              {stats.completedOrders}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-surface rounded-2xl border border-surface-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-surface-border flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-ink tracking-tight">
              Pesanan Terbaru
            </h2>
            <p className="text-xs text-ink-muted">
              Daftar transaksi pesanan pelanggan dari web dan kasir
            </p>
          </div>

          <Link
            href={`${basePath}/transactions`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-hover"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-ink-muted flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-ink">Belum Ada Transaksi</p>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Pesanan pelanggan dari meja atau kasir akan muncul di sini secara otomatis.
            </p>
            <div className="pt-2">
              <Link
                href={`${basePath}/transactions`}
                className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover transition-all"
              >
                <Receipt className="w-4 h-4" />
                <span>Buka Laporan Transaksi</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle/60 text-ink-muted border-b border-surface-border uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="px-5 py-3">No. Order</th>
                  <th className="px-4 py-3">Pelanggan / Meja</th>
                  <th className="px-4 py-3">Menu Dipesan</th>
                  <th className="px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {recentOrders.map((order) => {
                  const date = new Date(order.createdAt);
                  const timeStr = date.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-subtle/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-black text-ink">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          {order.table
                            ? `Meja ${order.table.tableNumber}`
                            : order.orderType}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="truncate text-ink-secondary font-medium">
                          {order.items
                            .map((it) => `${it.quantity}x ${it.menuItem.name}`)
                            .join(", ")}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-ink">
                          {order.paymentMethod === "QRIS" ? (
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>{order.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-ink">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(order.status, order.paymentStatus)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-ink-muted">
                        {timeStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner 1: Laporan Transaksi */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-black text-base">Laporan Transaksi</h3>
            <p className="text-xs text-white/80 max-w-xs">
              Pantau rincian nota, filter metode bayar kasir & QRIS, serta riwayat pesanan.
            </p>
          </div>
          <Link
            href={`${basePath}/transactions`}
            className="btn-press px-4 py-2 rounded-xl bg-white text-emerald-700 text-xs font-bold hover:bg-emerald-50 shadow-sm shrink-0 transition-all"
          >
            Lihat Transaksi
          </Link>
        </div>

        {/* Banner 2: Manajemen Menu */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-black text-base text-ink">Kelola Menu & Foto</h3>
            <p className="text-xs text-ink-muted max-w-xs">
              Tambah menu baru, atur harga, ketersediaan, serta upload foto asli otomatis WebP.
            </p>
          </div>
          <Link
            href={`${basePath}/menu`}
            className="btn-press px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-sm shrink-0 transition-all"
          >
            Atur Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
