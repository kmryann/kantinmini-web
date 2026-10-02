"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Store,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  X,
  Loader2,
  ShoppingBag,
  LogOut,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { LogoKantinMini } from "@/components/common/LogoKantinMini";
import type { AdminSessionPayload } from "@/lib/auth";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl: string;
  categoryId: string;
  hasSauceModifier: boolean;
  modifierName?: string | null;
  modifierOptions?: string | null;
  category?: Category;
}

interface DiningTable {
  id: string;
  tableNumber: number;
  status: string;
}

interface PosCartItem {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  sauceOption?: string;
  notes?: string;
}

interface CompletedOrderData {
  orderNumber: string;
  customerName: string;
  orderType: string;
  tableNumber?: number;
  paymentMethod: string;
  subtotal: number;
  totalAmount: number;
  cashReceived?: number;
  cashChange?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sauceOption?: string;
  }>;
  createdAt: string;
}

interface CashierClientProps {
  categories: Category[];
  items: MenuItem[];
  tables: DiningTable[];
  initialOrders: any[];
  currentUser: AdminSessionPayload;
}

export default function CashierClient({
  categories,
  items,
  tables,
  initialOrders,
  currentUser,
}: CashierClientProps) {
  const router = useRouter();



  // POS State
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [selectedTable, setSelectedTable] = useState<number>(tables[0]?.tableNumber || 1);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrderData | null>(null);
  const [mobilePosTab, setMobilePosTab] = useState<"catalog" | "cart">("catalog");

  // Sauce Selector Modal for items with sauce modifier
  const [sauceModalItem, setSauceModalItem] = useState<MenuItem | null>(null);
  const [pendingSauce, setPendingSauce] = useState<string>("Saus BBQ");



  // Filtered menu items for POS
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat =
        selectedCategory === "ALL" || item.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cashReceived = Number(cashReceivedInput) || 0;
  const changeAmount =
    paymentMethod === "CASH" && cashReceived >= subtotal
      ? cashReceived - subtotal
      : 0;

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    if (item.hasSauceModifier) {
      let defaultSauce = "Saus BBQ";
      if (item.modifierOptions) {
        try {
          const parsed = JSON.parse(item.modifierOptions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            defaultSauce = parsed[0];
          }
        } catch {
          // ignore
        }
      }
      setPendingSauce(defaultSauce);
      setSauceModalItem(item);
      return;
    }
    addToCartDirect(item);
  };

  const addToCartDirect = (item: MenuItem, sauceOption?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.menuItemId === item.id && c.sauceOption === sauceOption
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }

      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: 1,
          sauceOption,
        },
      ];
    });
  };

  const handleConfirmSauce = () => {
    if (sauceModalItem) {
      addToCartDirect(sauceModalItem, pendingSauce);
      setSauceModalItem(null);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const target = next[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index] = { ...target, quantity: newQty };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
    setCashReceivedInput("");
  };

  // Submit Order directly from POS
  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert("Mohon masukkan nama pelanggan.");
      return;
    }
    if (cart.length === 0) {
      alert("Keranjang kasir masih kosong.");
      return;
    }
    if (paymentMethod === "CASH" && cashReceivedInput && cashReceived < subtotal) {
      alert("Nominal uang tunai kurang dari total tagihan.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/pos/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          orderType,
          tableNumber: orderType === "DINE_IN" ? selectedTable : 1,
          paymentMethod,
          isPaidNow: true,
          cashReceived: paymentMethod === "CASH" ? cashReceived : undefined,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            price: c.price,
            sauceOption: c.sauceOption,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "Gagal membuat pesanan kasir.");
        setIsSubmitting(false);
        return;
      }

      const created = json.data;

      // Update state data order selesai
      const completed: CompletedOrderData = {
        orderNumber: created.orderNumber,
        customerName: created.customerName,
        orderType: created.orderType,
        tableNumber: created.table?.tableNumber,
        paymentMethod: created.paymentMethod,
        subtotal: created.subtotal,
        totalAmount: created.totalAmount,
        cashReceived: paymentMethod === "CASH" ? cashReceived : undefined,
        cashChange: paymentMethod === "CASH" ? changeAmount : undefined,
        items: created.items.map((it: any) => ({
          name: it.menuItem.name,
          quantity: it.quantity,
          price: it.price,
          sauceOption: it.sauceOption,
        })),
        createdAt: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setCompletedOrder(completed);


      // Reset form
      setCart([]);
      setCustomerName("");
      setCashReceivedInput("");
    } catch {
      alert("Terjadi kesalahan koneksi saat memproses order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };



  return (
    <div className="space-y-4">
      {/* Mobile Tab Toggle */}
      <div className="flex lg:hidden bg-surface p-1 rounded-xl border border-surface-border">
              <button
                type="button"
                onClick={() => setMobilePosTab("catalog")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mobilePosTab === "catalog"
                    ? "bg-brand text-white shadow-xs"
                    : "text-ink-secondary"
                }`}
              >
                Katalog Menu ({filteredItems.length})
              </button>
              <button
                type="button"
                onClick={() => setMobilePosTab("cart")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mobilePosTab === "cart"
                    ? "bg-brand text-white shadow-xs"
                    : "text-ink-secondary"
                }`}
              >
                <span>Keranjang Kasir</span>
                {totalQuantity > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {totalQuantity}
                  </span>
                )}
              </button>
            </div>

            {/* Grid 2 Kolom: Katalog & Keranjang */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Sisi Kiri: Katalog Produk Kasir (7 Kolom) */}
              <div
                className={`lg:col-span-7 space-y-4 ${
                  mobilePosTab === "cart" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-brand" />
                      <h2 className="text-sm font-extrabold text-ink">Pilih Menu Pesanan</h2>
                    </div>
                    <span className="text-xs text-ink-muted font-medium">
                      {items.length} Menu Siap Jual
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari makanan atau minuman..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white border border-surface-border focus:outline-hidden focus:border-brand font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("ALL")}
                      className={`btn-press px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedCategory === "ALL"
                          ? "bg-brand text-white shadow-2xs"
                          : "bg-surface-subtle text-ink-muted hover:text-ink border border-surface-border/60"
                      }`}
                    >
                      Semua
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`btn-press px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedCategory === cat.id
                            ? "bg-brand text-white shadow-2xs"
                            : "bg-surface-subtle text-ink-muted hover:text-ink border border-surface-border/60"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Menu Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className="btn-press bg-surface rounded-2xl border border-surface-border hover:border-brand/40 shadow-xs overflow-hidden flex flex-col justify-between group cursor-pointer transition-all"
                    >
                      <div className="relative aspect-4/3 w-full bg-surface-subtle overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.hasSauceModifier && (
                          <span className="absolute top-2 left-2 bg-brand/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                            Pilih Saus
                          </span>
                        )}
                      </div>

                      <div className="p-3 space-y-1">
                        <h4 className="font-extrabold text-xs text-ink line-clamp-1 group-hover:text-brand transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-black text-xs text-brand">
                            Rp {item.price.toLocaleString("id-ID")}
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-brand-light text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sisi Kanan: Panel Kasir & Keranjang (5 Kolom) */}
              <div
                className={`lg:col-span-5 bg-surface rounded-2xl border border-surface-border shadow-xs p-4 sm:p-5 space-y-4 ${
                  mobilePosTab === "catalog" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand" />
                    <h3 className="font-extrabold text-sm text-ink">Keranjang Kasir</h3>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>

                {/* Form Data Pelanggan & Meja */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1">
                      Nama Pelanggan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama pelanggan..."
                      className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs bg-white focus:outline-hidden focus:border-brand font-medium"
                    />
                  </div>

                  {/* Order Type Tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType("DINE_IN")}
                      className={`btn-press py-2 rounded-xl text-xs font-bold border transition-all ${
                        orderType === "DINE_IN"
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "bg-surface text-ink-secondary border-surface-border hover:bg-surface-subtle"
                      }`}
                    >
                      Makan di Tempat
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("TAKEAWAY")}
                      className={`btn-press py-2 rounded-xl text-xs font-bold border transition-all ${
                        orderType === "TAKEAWAY"
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "bg-surface text-ink-secondary border-surface-border hover:bg-surface-subtle"
                      }`}
                    >
                      Bungkus (Takeaway)
                    </button>
                  </div>

                  {/* Nomor Meja jika Dine In */}
                  {orderType === "DINE_IN" && (
                    <div>
                      <label className="text-xs font-bold text-ink block mb-1">
                        Pilih Nomor Meja:
                      </label>
                      <div className="grid grid-cols-7 gap-1.5">
                        {tables.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedTable(t.tableNumber)}
                            className={`btn-press py-2 rounded-xl text-xs font-black transition-all ${
                              selectedTable === t.tableNumber
                                ? "bg-brand text-white shadow-2xs"
                                : "bg-surface-subtle text-ink border border-surface-border/60 hover:bg-surface-border/50"
                            }`}
                          >
                            {t.tableNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Daftar Item di Keranjang */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-ink-muted text-xs space-y-1">
                      <ShoppingBag className="w-7 h-7 mx-auto opacity-40" />
                      <p>Keranjang masih kosong.</p>
                      <p className="text-[11px]">Pilih menu di sisi kiri untuk menambahkan.</p>
                    </div>
                  ) : (
                    cart.map((c, idx) => (
                      <div
                        key={`${c.menuItemId}-${c.sauceOption || ""}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-extrabold text-xs text-ink truncate">{c.name}</p>
                          {c.sauceOption && (
                            <p className="text-[10px] font-bold text-brand">{c.sauceOption}</p>
                          )}
                          <p className="text-[11px] font-semibold text-ink-muted">
                            Rp {c.price.toLocaleString("id-ID")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-ink hover:text-rose-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs text-ink w-4 text-center">
                            {c.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-ink hover:text-brand"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Metode Pembayaran & Total */}
                <div className="pt-3 border-t border-surface-border space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-ink block">Metode Pembayaran:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CASH")}
                        className={`btn-press p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                          paymentMethod === "CASH"
                            ? "bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-300/40"
                            : "bg-surface text-ink-secondary border-surface-border"
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-amber-600" />
                        <span>Tunai (Cash)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("QRIS")}
                        className={`btn-press p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                          paymentMethod === "QRIS"
                            ? "bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-300/40"
                            : "bg-surface text-ink-secondary border-surface-border"
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        <span>QRIS Instan</span>
                      </button>
                    </div>
                  </div>

                  {/* Cash Input jika Tunai */}
                  {paymentMethod === "CASH" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-ink block">Uang Diterima (Rp):</label>
                      <input
                        type="number"
                        value={cashReceivedInput}
                        onChange={(e) => setCashReceivedInput(e.target.value)}
                        placeholder={`Min. Rp ${subtotal.toLocaleString("id-ID")}`}
                        className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs bg-white focus:outline-hidden focus:border-brand font-mono font-bold"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCashReceivedInput(String(subtotal))}
                          className="px-2 py-1 rounded-lg bg-surface border border-surface-border text-[10px] font-bold text-ink hover:bg-surface-subtle"
                        >
                          Uang Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceivedInput("50000")}
                          className="px-2 py-1 rounded-lg bg-surface border border-surface-border text-[10px] font-bold text-ink hover:bg-surface-subtle"
                        >
                          50.000
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceivedInput("100000")}
                          className="px-2 py-1 rounded-lg bg-surface border border-surface-border text-[10px] font-bold text-ink hover:bg-surface-subtle"
                        >
                          100.000
                        </button>
                      </div>

                      {cashReceived >= subtotal && (
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-extrabold flex justify-between">
                          <span>Kembalian:</span>
                          <span>Rp {changeAmount.toLocaleString("id-ID")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total Tagihan */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-extrabold text-sm text-ink">Total Tagihan:</span>
                    <span className="font-black text-lg text-brand">
                      Rp {subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || cart.length === 0}
                    className="btn-press w-full py-3 rounded-2xl bg-brand text-white font-black text-sm shadow-md hover:bg-brand-hover transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Transaksi...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selesaikan & Bayar Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>



      {/* Modal: Pilihan Saus / Modifier */}
      {sauceModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface rounded-3xl border border-surface-border shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="font-extrabold text-sm text-ink">{sauceModalItem.name}</h3>
              <p className="text-xs text-ink-muted">Pilih varian saus untuk menu ini:</p>
            </div>

            <div className="space-y-1.5">
              {(sauceModalItem.modifierOptions
                ? JSON.parse(sauceModalItem.modifierOptions)
                : ["Saus BBQ", "Saus Teriyaki", "Saus Sambal"]
              ).map((sauce: string) => (
                <button
                  key={sauce}
                  type="button"
                  onClick={() => setPendingSauce(sauce)}
                  className={`btn-press w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    pendingSauce === sauce
                      ? "border-brand bg-brand-light/30 text-brand ring-2 ring-brand/30"
                      : "border-surface-border bg-surface text-ink hover:bg-surface-subtle"
                  }`}
                >
                  {sauce}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSauceModalItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSauce}
                className="btn-press flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-xs"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nota Sukses Order Baru */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-surface-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-ink">Transaksi Berhasil!</h3>
              <p className="text-xs text-ink-muted">Pesanan telah tercatat di kasir & dapur.</p>
            </div>

            <div className="bg-surface-subtle/60 p-4 rounded-2xl border border-surface-border space-y-2 font-mono text-xs">
              <div className="text-center border-b border-dashed border-surface-border pb-2">
                <p className="font-black text-sm text-ink font-sans">Kantin Mini</p>
                <p className="text-xs font-bold text-ink mt-0.5">#{completedOrder.orderNumber}</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-surface-border pb-2 text-ink-muted">
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="text-ink font-bold">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipe / Meja:</span>
                  <span className="text-ink font-semibold">
                    {completedOrder.orderType === "DINE_IN"
                      ? `Meja ${completedOrder.tableNumber || "-"}`
                      : "Bungkus (Takeaway)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="text-ink font-bold">{completedOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-1 py-1">
                {completedOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>
                      {it.quantity}x {it.name} {it.sauceOption ? `(${it.sauceOption})` : ""}
                    </span>
                    <span className="font-bold text-ink">
                      Rp {(it.price * it.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-surface-border pt-2 space-y-1">
                <div className="flex justify-between font-black text-sm text-ink">
                  <span>TOTAL:</span>
                  <span className="text-brand">
                    Rp {completedOrder.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                {completedOrder.cashReceived !== undefined && (
                  <>
                    <div className="flex justify-between text-[11px] text-ink-muted">
                      <span>Tunai Diterima:</span>
                      <span>Rp {completedOrder.cashReceived.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                      <span>Kembalian:</span>
                      <span>Rp {(completedOrder.cashChange || 0).toLocaleString("id-ID")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="btn-press flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="py-2.5 px-4 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
