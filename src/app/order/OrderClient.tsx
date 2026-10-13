"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/context/CartContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { CategoryWithItems, MenuItemType } from "@/types";
import { MenuCard } from "@/components/customer/MenuCard";
import { MenuDetailModal } from "@/components/customer/MenuDetailModal";
import { CustomizeModal } from "@/components/customer/CustomizeModal";
import { FloatingCartBar } from "@/components/customer/FloatingCartBar";
import { LogoKantinMini } from "@/components/common/LogoKantinMini";
import {
  Search,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface OrderClientProps {
  initialCategories?: CategoryWithItems[];
  storeSetting?: {
    orderMode: "DIRECT" | "WHATSAPP";
    whatsappNumber: string;
  };
}

export default function OrderClient({
  initialCategories = [],
  storeSetting = { orderMode: "WHATSAPP", whatsappNumber: "085117693117" },
}: OrderClientProps) {
  const searchParams = useSearchParams();
  const { setTableNumber, tableNumber, addToCart } = useCart();

  const [categories, setCategories] =
    useState<CategoryWithItems[]>(initialCategories);
  const [currentSetting, setCurrentSetting] = useState(storeSetting);
  const [isLoading, setIsLoading] = useState<boolean>(initialCategories.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    initialCategories.length > 0 ? initialCategories[0].slug : ""
  );

  // Modals state
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<MenuItemType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [selectedCustomizeItem, setSelectedCustomizeItem] =
    useState<MenuItemType | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);

  // Table Selector Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);

  // Prevent background scrolling when table switcher modal is open
  useBodyScrollLock(isTableModalOpen);

  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set Table Number from URL query parameter
  useEffect(() => {
    const tableParam = searchParams.get("table");
    if (tableParam) {
      const parsed = parseInt(tableParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
        setTableNumber(parsed);
      }
    }
  }, [searchParams, setTableNumber]);

  // Fetch Menu from API (hanya jika belum terisi via SSR)
  useEffect(() => {
    if (initialCategories.length > 0) return;

    async function loadMenu() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/menu");
        const json = await res.json();
        if (json.success && json.data) {
          setCategories(json.data);
          if (json.data.length > 0) {
            setActiveCategorySlug(json.data[0].slug);
          }
        } else {
          setError(json.error || "Gagal memuat menu.");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Gagal terhubung ke server.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, [initialCategories.length]);

  // Scrollspy observer for sticky category pills (dengan fallback aman untuk browser mobile)
  useEffect(() => {
    if (categories.length === 0 || searchQuery.trim()) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    try {
      const observer = new IntersectionObserver(
        (entries) => {
          if (isProgrammaticScrollRef.current) return;

          for (const entry of entries) {
            if (entry.isIntersecting) {
              const slug = entry.target.getAttribute("data-category-slug");
              if (slug) {
                setActiveCategorySlug(slug);
                const tabBtn = tabButtonRefs.current.get(slug);
                if (tabBtn) {
                  tabBtn.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                  });
                }
              }
            }
          }
        },
        {
          rootMargin: "0px 0px -40% 0px",
          threshold: 0,
        }
      );

      categoryRefs.current.forEach((el) => {
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    } catch (e) {
      console.warn("IntersectionObserver not supported:", e);
    }
  }, [categories, searchQuery]);

  const scrollToCategory = (slug: string) => {
    isProgrammaticScrollRef.current = true;
    setActiveCategorySlug(slug);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800);

    const element = categoryRefs.current.get(slug);
    if (element) {
      const navOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    const tabBtn = tabButtonRefs.current.get(slug);
    if (tabBtn) {
      tabBtn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleOpenDetail = useCallback((item: MenuItemType) => {
    setSelectedDetailItem(item);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  const handleOpenCustomize = useCallback((item: MenuItemType) => {
    setSelectedCustomizeItem(item);
    setIsCustomizeOpen(true);
  }, []);

  const handleCloseCustomize = useCallback(() => {
    setIsCustomizeOpen(false);
  }, []);

  const handleDetailToCustomize = useCallback((item: MenuItemType) => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setSelectedCustomizeItem(item);
      setIsCustomizeOpen(true);
    }, 140);
  }, []);

  // Quick Add for items without modifiers
  const handleQuickAdd = useCallback(
    (item: MenuItemType) => {
      addToCart(item, 1);
    },
    [addToCart]
  );

  // Add customized item to cart
  const handleCustomAddToCart = useCallback(
    (
      item: MenuItemType,
      quantity: number,
      sauceOption: string,
      notes?: string
    ) => {
      addToCart(item, quantity, sauceOption, notes);
    },
    [addToCart]
  );

  // Filter items based on search query
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.filter((item) =>
        searchQuery.trim()
          ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      ),
    }))
    .filter((cat) => cat.menuItems.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <span className="text-sm font-semibold text-ink-muted">
          Menyiapkan Menu Kantin Mini...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-600 mb-2" />
        <h2 className="text-lg font-bold text-ink">Gagal Memuat Menu</h2>
        <p className="text-sm text-ink-muted mt-1 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-press mt-4 px-4 py-2 rounded-xl bg-brand text-white font-bold text-sm"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink pb-28">
      {/* Top Header & Store Banner - Solid Brand Green */}
      <header className="sticky top-0 z-30 bg-brand text-white shadow-md border-b border-[#0e8064]">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <LogoKantinMini className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
              <div>
                <h1 className="text-base md:text-lg font-black leading-tight text-white tracking-tight">
                  Kantin Mini
                </h1>
              </div>
            </div>

            {/* Table Number Badge & Switcher - Hanya muncul di mode DIRECT (POS/Kasir) */}
            {currentSetting.orderMode === "DIRECT" ? (
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className="btn-press inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-xs font-medium text-emerald-100/90">Meja</span>
                <span className="text-sm font-extrabold text-white tracking-tight">{tableNumber}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/70 ml-0.5" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/15 text-white text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>Pesan via WhatsApp</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu favoritmu..."
              className="w-full pl-9 pr-9 py-2 rounded-xl text-xs md:text-sm bg-white text-gray-900 border border-transparent placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-white/40 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sticky Horizontal Category Tabs with Underline */}
        {!searchQuery && (
          <div className="max-w-xl mx-auto px-4 overflow-x-auto no-scrollbar flex items-center gap-1 pt-1 pb-1">
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  ref={(el) => {
                    if (el) tabButtonRefs.current.set(cat.slug, el);
                  }}
                  type="button"
                  onClick={() => scrollToCategory(cat.slug)}
                  className={`btn-press relative whitespace-nowrap pt-2.5 pb-2 px-3 text-xs md:text-sm font-bold transition-colors duration-200 shrink-0 ${
                    isActive
                      ? "text-white font-extrabold"
                      : "text-emerald-100/90 hover:text-white"
                  }`}
                >
                  {cat.name}
                  {isActive && (
                    <motion.span
                      layoutId="categoryActiveUnderline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Menu Section (matching GoFood & list-menu.png) */}
      <main className="max-w-xl mx-auto pb-8">
        {filteredCategories.length === 0 ? (
          <div className="py-20 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center mb-4 text-ink-muted/80 shadow-xs">
              <Search className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-ink mb-1.5">
              Menu Tidak Ditemukan
            </h3>
            <p className="text-xs md:text-sm text-ink-muted max-w-xs mb-5">
              Tidak ada menu yang sesuai dengan kata kunci &ldquo;<span className="font-semibold text-ink">{searchQuery}</span>&rdquo;. Coba gunakan kata kunci lain.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 text-xs font-semibold text-brand bg-brand-light/60 hover:bg-brand-light rounded-xl transition-colors active:scale-95 cursor-pointer"
            >
              Hapus Pencarian
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              data-category-slug={category.slug}
              ref={(el) => {
                if (el) categoryRefs.current.set(category.slug, el);
              }}
              className="scroll-mt-28"
            >
              {/* Category Section Header */}
              <div className="px-4 py-3 bg-canvas/90 backdrop-blur-xs border-b border-surface-border/60">
                <h2 className="text-md md:text-base font-extrabold text-ink tracking-tight uppercase">
                  {category.name}
                </h2>
              </div>

              {/* Edge-to-edge items with dividers like GoFood */}
              <div className="divide-y divide-surface-border/60 bg-surface border-b border-surface-border/60">
                {category.menuItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onOpenDetail={handleOpenDetail}
                    onOpenCustomize={handleOpenCustomize}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar />

      {/* Detail Modal */}
      <MenuDetailModal
        item={selectedDetailItem}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onOpenCustomize={handleDetailToCustomize}
        onQuickAdd={handleQuickAdd}
      />

      {/* Customize Modal */}
      <CustomizeModal
        item={selectedCustomizeItem}
        isOpen={isCustomizeOpen}
        onClose={handleCloseCustomize}
        onAddToCart={handleCustomAddToCart}
      />

      {/* Table Switcher Dialog */}
      <AnimatePresence>
        {isTableModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsTableModalOpen(false)}
              className="fixed inset-0 bg-black/60 will-change-[opacity]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-xs bg-surface rounded-2xl p-5 shadow-xl border border-surface-border space-y-4 z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-ink">Pilih Nomor Meja</h3>
                <button
                  onClick={() => setIsTableModalOpen(false)}
                  className="btn-press p-1 text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-ink-muted">
                Nomor meja biasanya terisi otomatis saat scan QR di atas meja fisik Anda.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setTableNumber(num);
                      setIsTableModalOpen(false);
                    }}
                    className={`btn-press py-2 rounded-xl text-sm font-extrabold border transition-all ${
                      tableNumber === num
                        ? "bg-brand text-white border-brand shadow-xs"
                        : "bg-surface-subtle text-ink border-surface-border hover:bg-brand-light hover:text-brand"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
