"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  CheckCircle2,
  Store,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  X,
  Loader2,
  ShoppingBag,
} from "lucide-react";

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

export default function PosClient({
  categories,
  items,
  tables,
}: {
  categories: Category[];
  items: MenuItem[];
  tables: DiningTable[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Order Details
  const [customerName, setCustomerName] = useState<string>("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [selectedTable, setSelectedTable] = useState<number>(
    tables[0]?.tableNumber || 1
  );
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");

  // Cart
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrderData | null>(
    null
  );
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Sauce Selector Modal for items with sauce modifier
  const [sauceModalItem, setSauceModalItem] = useState<MenuItem | null>(null);
  const [pendingSauce, setPendingSauce] = useState<string>("Saus BBQ");

  // Filtered menu items
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

  const parseOptions = (raw?: string | null): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  // Add Item to POS Cart
  const handleAddItem = (item: MenuItem) => {
    if (item.hasSauceModifier) {
      setSauceModalItem(item);
      const opts = parseOptions(item.modifierOptions);
      setPendingSauce(opts.length > 0 ? opts[0] : "Saus BBQ");
      return;
    }

    addToCartDirect(item);
  };

  const addToCartDirect = (item: MenuItem, sauceOption?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.menuItemId === item.id && i.sauceOption === sauceOption
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
            sauceOption: c.sauceOption,
            notes: c.notes,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "Gagal memproses pesanan.");
        return;
      }

      // Order created successfully
      const created = json.order;
      setCompletedOrder({
        orderNumber: created.orderNumber,
        customerName: created.customerName,
        orderType: created.orderType,
        tableNumber: created.table?.tableNumber,
        paymentMethod: created.paymentMethod,
        subtotal: created.subtotal,
        totalAmount: created.totalAmount,
        cashReceived: cashReceived > 0 ? cashReceived : created.totalAmount,
        cashChange: json.cashChange || 0,
        items: created.items.map((it: { menuItem: { name: string }; quantity: number; price: number; sauceOption?: string }) => ({
          name: it.menuItem.name,
          quantity: it.quantity,
          price: it.price,
          sauceOption: it.sauceOption,
        })),
        createdAt: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      // Reset form
      setCart([]);
      setCustomerName("");
      setCashReceivedInput("");
    } catch {
      alert("Terjadi kesalahan koneksi.");
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
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === "catalog"
              ? "bg-brand text-white shadow-xs"
              : "text-ink-secondary"
          }`}
        >
          Katalog Menu ({filteredItems.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "cart"
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

      {/* Main Grid: Left Catalog, Right Order Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Menu Catalog (Cols 7 on Desktop) */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileTab === "cart" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Search Bar & Header */}
          <div className="bg-surface rounded-2xl p-4 border border-surface-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-extrabold text-ink">
                  Pilih Menu Pesanan
                </h2>
              </div>
              <span className="text-xs text-ink-muted font-medium">
                {items.length} Menu
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu cepat..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-subtle border border-surface-border focus:bg-white focus:outline-hidden focus:border-brand text-xs md:text-sm font-medium"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`btn-press px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-brand text-white shadow-2xs"
                    : "bg-surface-subtle text-ink hover:bg-surface-border"
                }`}
              >
                Semua
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`btn-press px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-brand text-white shadow-2xs"
                      : "bg-surface-subtle text-ink hover:bg-surface-border"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-surface rounded-2xl p-10 text-center border border-surface-border space-y-2">
              <UtensilsCrossed className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-sm font-bold text-ink">Menu tidak ditemukan</p>
              <p className="text-xs text-ink-muted">
                {items.length === 0
                  ? "Belum ada menu yang aktif. Tambahkan menu di halaman Manajemen Menu."
                  : "Coba kata kunci pencarian yang lain."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="btn-press group bg-surface rounded-2xl border border-surface-border hover:border-brand hover:shadow-md p-3 flex flex-col justify-between cursor-pointer transition-all select-none"
                >
                  <div className="space-y-2">
                    {/* Image Container with bg-surface and object-contain */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface flex items-center justify-center">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-xs md:text-sm text-ink leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      {item.hasSauceModifier && (
                        <span className="inline-block text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded mt-1">
                          + Saus
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between mt-auto">
                    <span className="font-extrabold text-xs md:text-sm text-brand">
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-2xs group-hover:bg-brand-hover">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Order Receipt / Cart (Cols 5 on Desktop) */}
        <div
          className={`lg:col-span-5 bg-surface rounded-2xl border border-surface-border shadow-xs p-4 md:p-5 space-y-4 sticky top-4 ${
            mobileTab === "catalog" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-extrabold text-ink uppercase tracking-wider">
                Pesanan Kasir
              </h2>
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

          {/* Form Order Setup: Meja / Takeaway & Nama */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderType === "DINE_IN"
                    ? "bg-brand text-white shadow-2xs"
                    : "bg-surface-subtle text-ink hover:bg-surface-border"
                }`}
              >
                Makan di Tempat
              </button>
              <button
                type="button"
                onClick={() => setOrderType("TAKEAWAY")}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderType === "TAKEAWAY"
                    ? "bg-brand text-white shadow-2xs"
                    : "bg-surface-subtle text-ink hover:bg-surface-border"
                }`}
              >
                Bungkus (Takeaway)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {orderType === "DINE_IN" && (
                <div>
                  <label className="text-[11px] font-bold text-ink-muted block mb-1">
                    Nomor Meja
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs font-bold text-ink focus:outline-hidden focus:border-brand"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        Meja {num}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={orderType === "TAKEAWAY" ? "sm:col-span-2" : ""}>
                <label className="text-[11px] font-bold text-ink-muted block mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Bu Rina"
                  className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs font-semibold text-ink focus:bg-white focus:outline-hidden focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-ink-muted space-y-1">
                <ShoppingBag className="w-6 h-6 mx-auto text-ink-faint" />
                <p className="text-xs font-semibold">Belum ada item dipilih</p>
                <p className="text-[11px]">Klik menu di samping untuk menambahkan</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.menuItemId}-${item.sauceOption}-${idx}`}
                  className="p-2.5 rounded-xl bg-surface-subtle/70 border border-surface-border flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-ink truncate leading-tight">
                      {item.name}
                    </h4>
                    {item.sauceOption && (
                      <span className="text-[10px] text-amber-700 font-bold block">
                        {item.sauceOption}
                      </span>
                    )}
                    <span className="text-xs font-extrabold text-ink-secondary">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, -1)}
                      className="w-6 h-6 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-ink hover:bg-surface-border transition-all cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black text-ink">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(idx, 1)}
                      className="w-6 h-6 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-ink hover:bg-surface-border transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="w-6 h-6 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          {cart.length > 0 && (
            <div className="pt-2 border-t border-surface-border space-y-3">
              <div>
                <label className="text-[11px] font-bold text-ink-muted block mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === "CASH"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-surface-subtle text-ink hover:bg-surface-border"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tunai (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("QRIS")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === "QRIS"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-surface-subtle text-ink hover:bg-surface-border"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>QRIS</span>
                  </button>
                </div>
              </div>

              {/* Cash Input */}
              {paymentMethod === "CASH" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-ink-muted block">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(e.target.value)}
                    placeholder={`Min. ${subtotal}`}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs font-bold text-ink focus:bg-white focus:outline-hidden focus:border-brand"
                  />
                  {cashReceived > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <span className="text-ink-muted font-medium">Kembalian:</span>
                      <span
                        className={`font-black ${
                          cashReceived >= subtotal
                            ? "text-emerald-600"
                            : "text-rose-500"
                        }`}
                      >
                        {cashReceived >= subtotal
                          ? `Rp ${changeAmount.toLocaleString("id-ID")}`
                          : "Uang Kurang"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Row */}
              <div className="bg-surface-subtle p-3 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-secondary">
                  <span>Subtotal ({totalQuantity} item)</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-ink pt-1 border-t border-surface-border">
                  <span>Total Tagihan</span>
                  <span className="text-base text-brand">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="btn-press w-full py-3 rounded-xl bg-brand text-white font-extrabold text-xs md:text-sm shadow-md hover:bg-brand-hover transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bayar & Cetak Struk</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Modifier Modal */}
      {sauceModalItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 space-y-4 border border-surface-border shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-ink truncate">
                {sauceModalItem.modifierName || "Pilih Kustomisasi"} ({sauceModalItem.name})
              </h3>
              <button
                type="button"
                onClick={() => setSauceModalItem(null)}
                className="p-1 rounded-lg text-ink-muted hover:bg-surface-subtle cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(parseOptions(sauceModalItem.modifierOptions).length > 0
                ? parseOptions(sauceModalItem.modifierOptions)
                : ["Saus BBQ", "Saus Blackpepper", "Saus Asam Manis"]
              ).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPendingSauce(opt)}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                    pendingSauce === opt
                      ? "bg-brand text-white border-brand shadow-xs"
                      : "bg-surface text-ink border-surface-border hover:bg-surface-subtle"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleConfirmSauce}
              className="btn-press w-full py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-xs cursor-pointer"
            >
              Tambahkan ke Kasir
            </button>
          </div>
        </div>
      )}

      {/* Completed Order Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 space-y-4 border border-surface-border shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-surface-border">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-ink">KANTIN MINI</h3>
              <p className="text-[11px] text-ink-muted">
                Struk Transaksi Kasir #{completedOrder.orderNumber}
              </p>
              <p className="text-[10px] text-ink-muted">{completedOrder.createdAt}</p>
            </div>

            {/* Info Meja & Pelanggan */}
            <div className="text-xs space-y-1 pb-2 border-b border-dashed border-surface-border">
              <div className="flex justify-between">
                <span className="text-ink-muted">Pelanggan:</span>
                <span className="font-bold text-ink">
                  {completedOrder.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Tipe Order:</span>
                <span className="font-bold text-ink">
                  {completedOrder.orderType === "DINE_IN"
                    ? `Meja ${completedOrder.tableNumber}`
                    : "Takeaway"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Metode:</span>
                <span className="font-bold text-ink">
                  {completedOrder.paymentMethod} (LUNAS)
                </span>
              </div>
            </div>

            {/* Item List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs pb-2 border-b border-dashed border-surface-border">
              {completedOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-ink">
                      {it.quantity}x {it.name}
                    </span>
                    {it.sauceOption && (
                      <span className="text-[10px] text-ink-muted block">
                        ({it.sauceOption})
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-ink">
                    Rp {(it.price * it.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between font-bold text-ink">
                <span>Total:</span>
                <span className="text-sm font-black text-brand">
                  Rp {completedOrder.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
              {completedOrder.paymentMethod === "CASH" && (
                <>
                  <div className="flex justify-between text-ink-muted">
                    <span>Uang Diterima:</span>
                    <span>
                      Rp {(completedOrder.cashReceived || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Kembalian:</span>
                    <span>
                      Rp {(completedOrder.cashChange || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="btn-press flex-1 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-border text-ink text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="btn-press flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-xs transition-all cursor-pointer"
              >
                Selesai / Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
