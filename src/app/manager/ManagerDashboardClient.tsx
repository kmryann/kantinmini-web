"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  UtensilsCrossed,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  Flame,
  CreditCard,
  Banknote,
  Utensils,
  Receipt,
  Store,
  ChevronDown,
  Check,
  QrCode,
  Wallet,
} from "lucide-react";

export interface AnalyticsSummary {
  range: string;
  totalRevenue: number;
  totalOrders: number;
  paidOrdersCount: number;
  dineInCount: number;
  takeawayCount: number;
  cashCount: number;
  qrisCount: number;
  cashRevenue?: number;
  qrisRevenue?: number;
}

export interface TrendingMenu {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  imageUrl: string;
}

export interface DailyChartData {
  date: string;
  label: string;
  revenue: number;
  orderCount: number;
  dineInCount: number;
  takeawayCount: number;
}

export interface ManagerDashboardData {
  summary: AnalyticsSummary;
  trendingMenus: TrendingMenu[];
  charts: {
    chartRange: string;
    dailyData: DailyChartData[];
  };
}

interface ManagerDashboardClientProps {
  initialData: ManagerDashboardData;
}

// ----------------------------------------------------
// Komponen Dropdown Kustom Bergaya Apple / Modern
// ----------------------------------------------------
interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
  prefixIcon?: React.ComponentType<{ className?: string }>;
}

function CustomDropdown({
  value,
  onChange,
  options,
  prefixIcon: PrefixIcon,
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 active:scale-[0.98] border border-surface-border rounded-xl text-xs font-bold text-ink shadow-2xs hover:border-brand/40 focus:outline-hidden transition-all cursor-pointer select-none"
      >
        {PrefixIcon && <PrefixIcon className="w-3.5 h-3.5 text-brand shrink-0" />}
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-brand" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 min-w-[150px] bg-white border border-surface-border rounded-xl shadow-xl shadow-slate-900/10 p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-brand/10 text-brand font-black"
                    : "text-ink hover:text-brand hover:bg-surface-subtle"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Opsi Pilihan Filter Periode
const PERIOD_OPTIONS: DropdownOption[] = [
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "7d", label: "7 Hari Terakhir" },
  { value: "30d", label: "30 Hari Terakhir" },
  { value: "all", label: "Semua Riwayat" },
];

const CHART_MODE_OPTIONS: DropdownOption[] = [
  { value: "income", label: "Pendapatan" },
  { value: "orders", label: "Total Pesanan" },
];

const CHART_RANGE_OPTIONS: DropdownOption[] = [
  { value: "7d", label: "7 Hari Terakhir" },
  { value: "30d", label: "30 Hari Terakhir" },
];

export default function ManagerDashboardClient({
  initialData,
}: ManagerDashboardClientProps) {
  const [data, setData] = useState<ManagerDashboardData>(initialData);
  const [summaryRange, setSummaryRange] = useState<string>("today");
  const [chartRange, setChartRange] = useState<string>("7d");
  const [trendingRange, setTrendingRange] = useState<string>("today");
  const [chartMode, setChartMode] = useState<"income" | "orders">("income");
  const [isLoading, setIsLoading] = useState(false);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  const fetchAnalytics = async (
    newSummaryRange = summaryRange,
    newChartRange = chartRange,
    newTrendingRange = trendingRange
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("range", newSummaryRange);
      params.set("chartRange", newChartRange);
      params.set("trendingRange", newTrendingRange);

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat analitik manager:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummaryRangeChange = (r: string) => {
    setSummaryRange(r);
    fetchAnalytics(r, chartRange, trendingRange);
  };

  const handleChartRangeChange = (cr: string) => {
    setChartRange(cr);
    fetchAnalytics(summaryRange, cr, trendingRange);
  };

  const handleTrendingRangeChange = (tr: string) => {
    setTrendingRange(tr);
    fetchAnalytics(summaryRange, chartRange, tr);
  };

  const { summary, trendingMenus, charts } = data;

  // Skala sumbu Y grafik
  const maxRevenue = useMemo(() => {
    const max = Math.max(...charts.dailyData.map((d) => d.revenue), 100000);
    return Math.ceil(max / 50000) * 50000;
  }, [charts.dailyData]);

  const maxOrders = useMemo(() => {
    const max = Math.max(...charts.dailyData.map((d) => d.orderCount), 10);
    return Math.ceil(max / 5) * 5;
  }, [charts.dailyData]);

  // Persentase Tipe Pesanan
  const totalOrderType = summary.dineInCount + summary.takeawayCount || 1;
  const dineInPercent = Math.round((summary.dineInCount / totalOrderType) * 100);
  const takeawayPercent = Math.round((summary.takeawayCount / totalOrderType) * 100);

  // Persentase Metode Pembayaran
  const totalPayments = summary.qrisCount + summary.cashCount || 1;
  const qrisPercent = Math.round((summary.qrisCount / totalPayments) * 100);
  const cashPercent = Math.round((summary.cashCount / totalPayments) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Baris Judul & Filter Utama (Bersih, Ramping, Elegan Tanpa Box Berat) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-ink tracking-tight">
            Dashboard Manager
          </h1>
          <p className="text-xs text-ink-muted">
            Ringkasan performa finansial, tren harian, tipe pesanan, dan menu terlaris.
          </p>
        </div>

        {/* Filter Periode Utama */}
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={summaryRange}
            onChange={handleSummaryRangeChange}
            options={PERIOD_OPTIONS}
          />

          <button
            type="button"
            onClick={() => fetchAnalytics(summaryRange, chartRange, trendingRange)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-surface-border text-ink hover:text-brand shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Ringkasan KPI Utama: Total Pendapatan & Total Pesanan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* Total Pendapatan */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border shadow-2xs relative overflow-hidden group hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Total Pendapatan
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black text-ink tracking-tight font-mono">
              Rp {summary.totalRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-ink-muted mt-1.5 flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">
                {summary.paidOrdersCount} Transaksi Lunas
              </span>
              <span>•</span>
              <span className="capitalize">
                {PERIOD_OPTIONS.find((p) => p.value === summaryRange)?.label}
              </span>
            </p>
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="bg-surface p-5 rounded-2xl border border-surface-border shadow-2xs relative overflow-hidden group hover:border-brand/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Total Pesanan
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-black text-ink tracking-tight font-mono">
              {summary.totalOrders} <span className="text-sm font-semibold text-ink-muted">Pesanan</span>
            </div>
            <p className="text-xs text-ink-muted mt-1.5">
              Semua status pesanan masuk pada periode terpilih
            </p>
          </div>
        </div>
      </div>

      {/* 3. Baris Kedua: Grid 4 Kolom
          - Kolom 1 & 2 (Setengah Layar = 50%): Card Grafik Tren
          - Kolom 3 (25% Layar): Card Trending Menu (Lebar sama dengan Kolom 4)
          - Kolom 4 (25% Layar): Card Tipe Pesanan & Card Metode Pembayaran
      */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Kolom 1 & 2: Grafik Penjualan (Setengah Layar) */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
            <div>
              <h2 className="text-base font-black text-ink tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand" />
                <span>{chartMode === "income" ? "Grafik Pendapatan" : "Grafik Total Pesanan"}</span>
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Tren harian {chartRange === "7d" ? "7 hari terakhir" : "30 hari terakhir"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CustomDropdown
                value={chartMode}
                onChange={(v) => setChartMode(v as "income" | "orders")}
                options={CHART_MODE_OPTIONS}
              />
              <CustomDropdown
                value={chartRange}
                onChange={handleChartRangeChange}
                options={CHART_RANGE_OPTIONS}
              />
            </div>
          </div>

          {/* Area Visual Bar Chart */}
          <div className="pt-2">
            {charts.dailyData.length === 0 ? (
              <div className="py-20 text-center text-xs text-ink-muted">
                Belum ada data untuk ditampilkan.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visual Bars Container */}
                <div className="h-64 flex items-end gap-1.5 md:gap-2 pt-6 pb-2 border-b border-surface-border px-1">
                  {charts.dailyData.map((d, index) => {
                    const val = chartMode === "income" ? d.revenue : d.orderCount;
                    const maxVal = chartMode === "income" ? maxRevenue : maxOrders;
                    const heightPercent =
                      maxVal > 0 ? Math.min(100, Math.max(8, Math.round((val / maxVal) * 100))) : 8;
                    const isActive = activeBarIndex === index;
                    const isRightSide = index >= charts.dailyData.length - 3;

                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
                        onMouseEnter={() => setActiveBarIndex(index)}
                        onMouseLeave={() => setActiveBarIndex(null)}
                        onClick={() => setActiveBarIndex(isActive ? null : index)}
                        onTouchStart={() => setActiveBarIndex(isActive ? null : index)}
                      >
                        {/* Tooltip Menempel Tepat di Sebelah Batang (Kiri atau Kanan) */}
                        {isActive && (
                          <div
                            className={`absolute z-30 bottom-1/2 translate-y-1/2 pointer-events-none whitespace-nowrap bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 text-xs animate-in fade-in zoom-in-95 duration-150 ${
                              isRightSide ? "right-full mr-2.5" : "left-full ml-2.5"
                            }`}
                          >
                            {/* Panah Penunjuk Segitiga */}
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent ${
                                isRightSide
                                  ? "left-full border-l-4 border-l-slate-900"
                                  : "right-full border-r-4 border-r-slate-900"
                              }`}
                            />

                            <div className="font-bold text-slate-300 text-[10px] border-b border-slate-700/80 pb-1 mb-1">
                              {new Date(d.date).toLocaleDateString("id-ID", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-slate-400 text-[10px]">Pendapatan:</span>
                              <span className="font-extrabold text-emerald-400 font-mono">
                                Rp {d.revenue.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span className="text-slate-400 text-[10px]">Pesanan:</span>
                              <span className="font-bold text-blue-300 font-mono">
                                {d.orderCount} Order
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Bar Visual Fill */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            chartMode === "income"
                              ? isActive
                                ? "bg-brand ring-2 ring-brand/40 shadow-md scale-y-[1.02]"
                                : "bg-brand/80 hover:bg-brand"
                              : isActive
                              ? "bg-blue-600 ring-2 ring-blue-500/40 shadow-md scale-y-[1.02]"
                              : "bg-blue-500/80 hover:bg-blue-600"
                          }`}
                        />

                        {/* Small Top Label jika 7d */}
                        {chartRange === "7d" && val > 0 && !isActive && (
                          <span className="text-[10px] font-bold text-ink-muted absolute -top-5 truncate max-w-full">
                            {chartMode === "income" ? `${Math.round(val / 1000)}k` : val}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sumbu X Label */}
                <div className="flex justify-between items-center text-[10px] md:text-xs text-ink-muted font-bold px-1">
                  {charts.dailyData.map((d, i) => {
                    const showLabel =
                      chartRange === "7d" || i % 5 === 0 || i === charts.dailyData.length - 1;
                    return (
                      <div key={d.date} className="flex-1 text-center truncate">
                        {showLabel ? d.label : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom 3: Trending Menus (Lebar = 25% Layar, Sama dengan Kolom 4) */}
        <div className="lg:col-span-1 bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm text-ink truncate">Menu Terlaris</h3>
                <p className="text-[11px] text-ink-muted truncate">Paling banyak dipesan</p>
              </div>
            </div>

            {/* Dropdown Filter Trending Menu */}
            <CustomDropdown
              value={trendingRange}
              onChange={handleTrendingRangeChange}
              options={PERIOD_OPTIONS}
            />
          </div>

          {trendingMenus.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-muted space-y-1">
              <UtensilsCrossed className="w-7 h-7 mx-auto opacity-30" />
              <p>Belum ada penjualan di periode ini.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trendingMenus.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-surface-subtle/50 hover:bg-white border border-transparent hover:border-surface-border transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Foto Menu + Badge Peringkat */}
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white border border-surface-border shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-muted">
                          <UtensilsCrossed className="w-4 h-4 opacity-50" />
                        </div>
                      )}

                      {/* Ranking Badge Overlay */}
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-md text-[9px] font-black flex items-center justify-center shadow-xs ${
                          idx === 0
                            ? "bg-amber-500 text-white"
                            : idx === 1
                            ? "bg-slate-400 text-white"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-black/40 text-white backdrop-blur-xs"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>

                    {/* Info Menu */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-ink truncate">{item.name}</h4>
                      <p className="text-[10px] text-ink-muted font-mono">
                        Rp {item.revenue.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Tag Porsi Terjual */}
                  <span className="shrink-0 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-black">
                    {item.quantity} terjual
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kolom 4: Tipe Pesanan (Lebar = 25% Layar, Sama dengan Kolom 3 Trending Menu) */}
        <div className="lg:col-span-1 bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-ink">Tipe Pesanan</h3>
                <p className="text-[11px] text-ink-muted">Dine In vs Takeaway</p>
              </div>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-surface-subtle text-ink-muted border border-surface-border">
              {summary.totalOrders} Pesanan
            </span>
          </div>

          {/* 2 Mini Box */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-surface-subtle/80 border border-surface-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  Dine In (Makan di Tempat)
                </span>
                <span className="text-lg font-black text-ink font-mono block">
                  {summary.dineInCount} <span className="text-xs font-medium text-ink-muted">Order</span>
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-black">
                {dineInPercent}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle/80 border border-surface-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Takeaway (Bungkus)
                </span>
                <span className="text-lg font-black text-ink font-mono block">
                  {summary.takeawayCount} <span className="text-xs font-medium text-ink-muted">Order</span>
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black border border-amber-200/60">
                {takeawayPercent}%
              </span>
            </div>
          </div>

          {/* Dual Segment Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-bold text-ink-muted">
              <span>Rasio Pemesanan</span>
              <span>{dineInPercent}% : {takeawayPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-subtle overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${dineInPercent}%` }}
                className="bg-brand h-full transition-all duration-500"
                title={`Dine In: ${dineInPercent}%`}
              />
              <div
                style={{ width: `${takeawayPercent}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`Takeaway: ${takeawayPercent}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Akses Cepat Navigasi Manager */}
      <div className="bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 space-y-3">
        <h3 className="font-black text-sm text-ink">Akses Cepat Manager</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/manager/transactions"
            className="btn-press flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-surface-border hover:border-brand/40 text-xs font-bold text-ink transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-brand" />
              <span>Laporan Riwayat Transaksi</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
          </Link>

          <Link
            href="/manager/menu"
            className="btn-press flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-surface-border hover:border-brand/40 text-xs font-bold text-ink transition-all"
          >
            <div className="flex items-center gap-2.5">
              <UtensilsCrossed className="w-4 h-4 text-brand" />
              <span>Ubah & Atur Urutan Menu</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
          </Link>

          <Link
            href="/order"
            target="_blank"
            className="btn-press flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-surface-border hover:border-brand/40 text-xs font-bold text-ink transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-brand" />
              <span>Lihat Tampilan Web Pelanggan</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
          </Link>
        </div>
      </div>
    </div>
  );
}
