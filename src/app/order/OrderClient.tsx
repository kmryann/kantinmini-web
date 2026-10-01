"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CategoryWithItems, MenuItemType } from "@/types";
import { MenuCard } from "@/components/customer/MenuCard";
import { MenuDetailModal } from "@/components/customer/MenuDetailModal";
import { CustomizeModal } from "@/components/customer/CustomizeModal";
import { FloatingCartBar } from "@/components/customer/FloatingCartBar";
import {
  Utensils,
  Search,
  X,
  MapPin,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface OrderClientProps {
  initialCategories?: CategoryWithItems[];
}

export default function OrderClient({ initialCategories = [] }: OrderClientProps) {
  const searchParams = useSearchParams();
  const { setTableNumber, tableNumber, addToCart } = useCart();

  const [categories, setCategories] =
    useState<CategoryWithItems[]>(initialCategories);
  const [isLoading, setIsLoading] = useState<boolean>(initialCategories.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(
    initialCategories.length > 0 ? initialCategories[0].slug : ""
  );

  // Modals state
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<MenuItemType | null>(null);
  const [selectedCustomizeItem, setSelectedCustomizeItem] =
    useState<MenuItemType | null>(null);

  // Table Selector Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);

  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());

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
  }, []);

  // Scrollspy observer for sticky category pills (dengan fallback aman untuk browser mobile)
  useEffect(() => {
    if (categories.length === 0 || searchQuery.trim()) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    try {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const slug = entry.target.getAttribute("data-category-slug");
              if (slug) {
                setActiveCategorySlug(slug);
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
    setActiveCategorySlug(slug);
    const element = categoryRefs.current.get(slug);
    if (element) {
      const navOffset = 110;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Quick Add for items without modifiers
  const handleQuickAdd = (item: MenuItemType) => {
    addToCart(item, 1);
  };

  // Add customized item to cart
  const handleCustomAddToCart = (
    item: MenuItemType,
    quantity: number,
    sauceOption: string,
    notes?: string
  ) => {
    addToCart(item, quantity, sauceOption, notes);
  };

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
      {/* Top Header & Store Banner - Solid Opaque, Bersih Tanpa Garis Abu-abu */}
      <header className="sticky top-0 z-30 bg-canvas">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-ink leading-tight">
                  Kantin Mini
                </h1>
                <div className="flex items-center gap-1 text-[11px] text-ink-muted font-medium">
                  <MapPin className="w-3 h-3 text-brand" />
                  <span>Dine-in & Takeaway</span>
                </div>
              </div>
            </div>

            {/* Table Number Badge & Switcher */}
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-surface-border shadow-xs text-xs font-bold text-ink hover:border-brand-muted"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Meja {tableNumber}</span>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu favoritmu..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-surface-subtle/80 border border-surface-border text-xs md:text-sm text-ink placeholder:text-ink-faint focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand-light transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
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
                  type="button"
                  onClick={() => scrollToCategory(cat.slug)}
                  className={`btn-press relative whitespace-nowrap pt-2.5 pb-2 px-3 text-xs md:text-sm font-bold transition-colors shrink-0 ${
                    isActive
                      ? "text-brand font-extrabold"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {cat.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Menu Section (matching list-menu.png) */}
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-sm">
            Tidak ada menu yang sesuai dengan pencarian &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              data-category-slug={category.slug}
              ref={(el) => {
                if (el) categoryRefs.current.set(category.slug, el);
              }}
              className="space-y-3.5 scroll-mt-32"
            >
              <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-ink pl-1">
                {category.name}
              </h2>

              <div className="space-y-3">
                {category.menuItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onOpenDetail={(i) => setSelectedDetailItem(i)}
                    onOpenCustomize={(i) => setSelectedCustomizeItem(i)}
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
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        onOpenCustomize={(i) => setSelectedCustomizeItem(i)}
        onQuickAdd={handleQuickAdd}
      />

      {/* Customize Modal */}
      <CustomizeModal
        item={selectedCustomizeItem}
        isOpen={Boolean(selectedCustomizeItem)}
        onClose={() => setSelectedCustomizeItem(null)}
        onAddToCart={handleCustomAddToCart}
      />

      {/* Table Switcher Dialog */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-surface rounded-2xl p-5 shadow-xl border border-surface-border space-y-4">
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
          </div>
        </div>
      )}
    </div>
  );
}
