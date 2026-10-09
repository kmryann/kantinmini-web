"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  Upload,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Check,
  X,
  AlertCircle,
  Loader2,
  Store,
  Plus,
  UtensilsCrossed,
  Eye,
  Save,
} from "lucide-react";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
  isBestSeller: boolean;
  hasSauceModifier: boolean;
  modifierName?: string | null;
  modifierOptions?: string | null;
  sortOrder?: number;
  category?: CategoryOption;
}

interface MenuFormPageClientProps {
  categories: CategoryOption[];
  initialItem?: MenuItemData | null;
  role: "ADMIN" | "MANAGER";
  backUrl: string;
}

export default function MenuFormPageClient({
  categories,
  initialItem = null,
  role,
  backUrl,
}: MenuFormPageClientProps) {
  const router = useRouter();
  const isEditMode = Boolean(initialItem);

  // Inisialisasi opsi modifier
  const initialModifierOptions = (() => {
    if (!initialItem?.modifierOptions) {
      return ["Saus BBQ", "Saus Blackpepper", "Saus Sambal Matah", "Saus Curry"];
    }
    try {
      const parsed = JSON.parse(initialItem.modifierOptions);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      return initialItem.modifierOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return ["Saus BBQ", "Saus Blackpepper", "Saus Sambal Matah", "Saus Curry"];
  })();

  // Form State
  const [formName, setFormName] = useState<string>(initialItem?.name || "");
  const [formDescription, setFormDescription] = useState<string>(
    initialItem?.description || ""
  );
  const [formPrice, setFormPrice] = useState<string>(
    initialItem ? initialItem.price.toString() : ""
  );
  const [formCategoryId, setFormCategoryId] = useState<string>(
    initialItem?.categoryId || categories[0]?.id || ""
  );
  const [formImageUrl, setFormImageUrl] = useState<string>(
    initialItem?.imageUrl || ""
  );
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(
    initialItem ? initialItem.isAvailable : true
  );
  const [formIsBestSeller, setFormIsBestSeller] = useState<boolean>(
    initialItem ? initialItem.isBestSeller : false
  );
  const [formHasModifier, setFormHasModifier] = useState<boolean>(
    initialItem ? Boolean(initialItem.hasSauceModifier) : false
  );
  const [formModifierName, setFormModifierName] = useState<string>(
    initialItem?.modifierName || "Pilihan Saus"
  );
  const [formModifierOptions, setFormModifierOptions] =
    useState<string[]>(initialModifierOptions);
  const [newOptionInput, setNewOptionInput] = useState<string>("");
  const [formImageMode, setFormImageMode] = useState<"upload" | "url">(
    initialItem?.imageUrl?.startsWith("/uploads/") ? "upload" : "upload"
  );
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper Modifier Presets
  const handleApplyModifierPreset = (name: string, options: string[]) => {
    setFormModifierName(name);
    setFormModifierOptions(options);
  };

  const handleAddModifierOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (!formModifierOptions.includes(trimmed)) {
      setFormModifierOptions((prev) => [...prev, trimmed]);
    }
    setNewOptionInput("");
  };

  const handleRemoveModifierOption = (indexToRemove: number) => {
    setFormModifierOptions((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
  };

  // Upload Foto ke Server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setFormError("Hanya file foto PNG, JPG, atau WebP (maksimal 6MB) yang diperbolehkan.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setFormError("Ukuran file maksimal 6MB.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setFormError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormImageUrl(json.url);
      } else {
        setFormError(json.error || "Gagal mengunggah foto.");
      }
    } catch {
      setFormError("Terjadi kesalahan koneksi saat mengunggah foto.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Submit Menu Baru atau Edit Menu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError("Nama menu wajib diisi.");
      return;
    }

    const parsedPrice = parseInt(formPrice.replace(/[^0-9]/g, ""), 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError("Harga menu harus lebih besar dari Rp 0.");
      return;
    }

    if (!formCategoryId) {
      setFormError("Silakan pilih kategori menu.");
      return;
    }

    if (!formImageUrl.trim()) {
      setFormError("Silakan unggah foto menu atau masukkan tautan (URL) foto.");
      return;
    }

    let finalOptions = [...formModifierOptions];
    if (newOptionInput.trim() && !finalOptions.includes(newOptionInput.trim())) {
      finalOptions.push(newOptionInput.trim());
    }

    if (formHasModifier) {
      if (!formModifierName.trim()) {
        setFormError("Silakan tentukan nama kustomisasi (contoh: Pilihan Saus).");
        return;
      }
      if (finalOptions.length === 0) {
        setFormError("Silakan masukkan minimal 1 opsi varian (contoh: Saus BBQ).");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        price: parsedPrice,
        categoryId: formCategoryId,
        imageUrl: formImageUrl.trim(),
        isAvailable: formIsAvailable,
        isBestSeller: formIsBestSeller,
        hasSauceModifier: formHasModifier,
        modifierName: formHasModifier ? (formModifierName.trim() || "Pilihan") : null,
        modifierOptions: formHasModifier ? JSON.stringify(finalOptions) : null,
      };

      const endpoint = isEditMode
        ? `/api/admin/menu/${initialItem?.id}`
        : "/api/admin/menu";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || `Gagal ${isEditMode ? "memperbarui" : "menambahkan"} menu.`);
      } else {
        router.push(backUrl);
        router.refresh();
      }
    } catch {
      setFormError("Terjadi kesalahan koneksi saat menyimpan menu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === formCategoryId);
  const displayPrice = parseInt(formPrice.replace(/[^0-9]/g, ""), 10) || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        <Link
          href={role === "MANAGER" ? "/manager" : "/admin"}
          className="hover:text-ink transition-colors flex items-center gap-1.5"
        >
          <Store className="w-3.5 h-3.5" />
          <span>{role === "MANAGER" ? "Manager" : "Admin"}</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ink-muted/40" />
        <Link
          href={backUrl}
          className="hover:text-ink transition-colors"
        >
          Menu
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ink-muted/40" />
        <span className="text-brand font-bold">
          {isEditMode ? `Edit: ${initialItem?.name}` : "Tambah Menu Baru"}
        </span>
      </nav>

      {/* 2. Header Halaman (Hanya Judul & Navigasi Kembali, Tanpa Tombol Simpan Dobel) */}
      <div className="flex items-center gap-3">
        <Link
          href={backUrl}
          className="p-2.5 rounded-xl bg-surface border border-surface-border hover:border-brand/40 text-ink-muted hover:text-ink transition-all shadow-2xs"
          title="Kembali ke Daftar Menu"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-ink tracking-tight">
            {isEditMode ? "Edit Menu" : "Tambah Menu Baru"}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {isEditMode
              ? `Perbarui informasi, harga, foto, atau kustomisasi untuk ${initialItem?.name}.`
              : "Isi informasi produk makanan atau minuman untuk ditambahkan ke katalog Kantin Mini."}
          </p>
        </div>
      </div>

      {/* Error Alert Banner */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="leading-snug">{formError}</span>
        </div>
      )}

      {/* 3. Form Grid Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Detail Informasi & Modifier (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Informasi Utama Menu */}
          <div className="bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 md:p-6 space-y-4">
            <h2 className="text-sm font-black text-ink tracking-tight pb-3 border-b border-surface-border flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-brand" />
              <span>Detail Produk</span>
            </h2>

            {/* Nama Menu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">
                Nama Menu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Chicken Katsu BBQ Sambal Matah"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs sm:text-sm font-bold text-ink focus:outline-hidden focus:border-brand focus:bg-white transition-all"
                required
              />
            </div>

            {/* Kategori & Harga */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Kategori */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs sm:text-sm font-bold text-ink focus:outline-hidden focus:border-brand focus:bg-white transition-all cursor-pointer"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga Jual */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink">
                  Harga Jual (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="25000"
                    min="0"
                    step="500"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs sm:text-sm font-black text-ink font-mono focus:outline-hidden focus:border-brand focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">
                Deskripsi Singkat (Opsional)
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Jelaskan isi porsi, bahan utama, atau cita rasa menu..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs sm:text-sm font-medium text-ink focus:outline-hidden focus:border-brand focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Status Ketersediaan & Best Seller */}
            <div className="pt-2 border-t border-surface-border/60 space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/60 border border-surface-border/80 cursor-pointer select-none hover:bg-surface-subtle transition-all">
                <div>
                  <span className="font-bold text-ink text-xs block">
                    Ketersediaan Menu
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {formIsAvailable ? "Menu aktif dan dapat dipesan pelanggan" : "Menu ditandai HABIS"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsAvailable}
                  onChange={(e) => setFormIsAvailable(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/60 border border-surface-border/80 cursor-pointer select-none hover:bg-surface-subtle transition-all">
                <div>
                  <span className="font-bold text-ink text-xs flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Tandai Sebagai Best Seller</span>
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    Tampilkan badge emas &ldquo;Best Seller&rdquo; pada menu ini
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsBestSeller}
                  onChange={(e) => setFormIsBestSeller(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Card: Kustomisasi & Modifier (Pilihan Saus / Level Pedas dsb) */}
          <div className="bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-border">
              <div>
                <h2 className="text-sm font-black text-ink tracking-tight flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Kustomisasi & Modifier</span>
                </h2>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Aktifkan jika pelanggan wajib memilih varian sebelum memasukkan ke keranjang.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={formHasModifier}
                onClick={() => setFormHasModifier((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  formHasModifier ? "bg-brand" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formHasModifier ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {formHasModifier && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {/* Nama Kustomisasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink">
                    Judul Kustomisasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formModifierName}
                    onChange={(e) => setFormModifierName(e.target.value)}
                    placeholder="Contoh: Pilihan Saus / Tingkat Kepedasan / Level Es"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs font-bold text-ink focus:outline-hidden focus:border-brand focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-ink-muted">
                    Judul ini yang akan muncul sebagai pilihan di layar pelanggan.
                  </p>
                </div>

                {/* Preset Cepat */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-ink-muted flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-brand" />
                    <span>Template Pilihan Cepat:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyModifierPreset("Pilihan Saus", [
                          "Saus BBQ",
                          "Saus Blackpepper",
                          "Saus Sambal Matah",
                          "Saus Curry",
                        ])
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border text-[11px] font-bold text-ink hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
                    >
                      Pilihan Saus
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyModifierPreset("Level Kepedasan", [
                          "Level 0 (Tidak Pedas)",
                          "Level 1 (Sedang)",
                          "Level 2 (Pedas)",
                          "Level 3 (Ekstra Pedas)",
                        ])
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border text-[11px] font-bold text-ink hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
                    >
                      Level Pedas
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyModifierPreset("Level Es & Gula", [
                          "Normal Ice & Sugar",
                          "Less Ice (Sedikit Es)",
                          "Less Sugar (Sedikit Gula)",
                          "No Sugar (Tanpa Gula)",
                        ])
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border text-[11px] font-bold text-ink hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
                    >
                      Es & Gula
                    </button>
                  </div>
                </div>

                {/* Daftar Varian */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink">
                    Daftar Opsi Varian ({formModifierOptions.length}) <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-xl bg-surface-subtle/50 border border-surface-border">
                    {formModifierOptions.map((opt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-surface-border text-xs font-bold text-ink shadow-2xs animate-in zoom-in-95"
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveModifierOption(idx)}
                          className="text-ink-muted hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus opsi ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {formModifierOptions.length === 0 && (
                      <span className="text-xs text-ink-muted italic py-1">
                        Belum ada opsi varian yang ditambahkan.
                      </span>
                    )}
                  </div>

                  {/* Input Tambah Opsi */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddModifierOption();
                        }
                      }}
                      placeholder="Ketik opsi varian lalu klik Tambah..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-surface-border text-xs font-semibold text-ink focus:outline-hidden focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={handleAddModifierOption}
                      className="btn-press px-3.5 py-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold transition-all cursor-pointer"
                    >
                      Tambah Opsi
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Foto Menu & Live Preview (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Upload Foto Menu */}
          <div className="bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h2 className="text-sm font-black text-ink tracking-tight flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand" />
                <span>Foto Produk <span className="text-rose-500">*</span></span>
              </h2>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormImageMode("upload")}
                  className={`font-bold cursor-pointer transition-colors ${
                    formImageMode === "upload"
                      ? "text-brand underline decoration-2 underline-offset-4"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Unggah File
                </button>
                <span className="text-surface-border">•</span>
                <button
                  type="button"
                  onClick={() => setFormImageMode("url")}
                  className={`font-bold cursor-pointer transition-colors ${
                    formImageMode === "url"
                      ? "text-brand underline decoration-2 underline-offset-4"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Input URL
                </button>
              </div>
            </div>

            {formImageMode === "upload" ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-surface-border hover:border-brand rounded-2xl p-6 text-center cursor-pointer transition-all bg-surface-subtle/50 hover:bg-brand/5 flex flex-col items-center justify-center gap-3 min-h-[170px]"
                >
                  {formImageUrl ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="relative w-44 h-32 rounded-xl overflow-hidden border border-surface-border shadow-xs bg-white">
                        <Image
                          src={formImageUrl}
                          alt="Preview Menu"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <span className="text-xs font-bold text-brand hover:underline">
                        Klik untuk mengganti foto
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shadow-xs">
                        {isUploadingImage ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        {isUploadingImage ? (
                          <span className="text-xs text-brand font-bold">
                            Mengunggah & mengonversi foto...
                          </span>
                        ) : (
                          <>
                            <span className="text-xs sm:text-sm font-bold text-brand block">
                              Pilih Foto dari Perangkat
                            </span>
                            <span className="text-[11px] text-ink-muted block mt-0.5">
                              PNG, JPG, WebP (Maksimal 6MB)
                            </span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs sm:text-sm font-medium focus:outline-hidden focus:border-brand focus:bg-white transition-all"
                />
                {formImageUrl && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-surface-border bg-white p-2">
                    <Image
                      src={formImageUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card: Live Preview Tampilan Pelanggan */}
          <div className="bg-surface rounded-2xl border border-surface-border shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-brand" />
                <span>Live Preview Pelanggan</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand/10 text-brand">
                {selectedCategory?.name || "Kategori"}
              </span>
            </div>

            {/* Mockup Card Menu */}
            <div className="p-3.5 rounded-2xl bg-white border border-surface-border shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                {formIsBestSeller && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Flame className="w-2.5 h-2.5 fill-amber-500" />
                    Best Seller
                  </span>
                )}
                <h4 className="font-extrabold text-sm text-ink truncate">
                  {formName.trim() || "Nama Menu Anda"}
                </h4>
                <p className="text-[11px] text-ink-muted line-clamp-2">
                  {formDescription.trim() || "Deskripsi menu akan muncul di sini untuk dilihat oleh pelanggan..."}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-sm font-black text-brand font-mono">
                    Rp {displayPrice.toLocaleString("id-ID")}
                  </span>
                  {!formIsAvailable && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      Habis
                    </span>
                  )}
                </div>
              </div>

              {/* Foto Mockup */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-subtle border border-surface-border shrink-0">
                {formImageUrl ? (
                  <Image
                    src={formImageUrl}
                    alt="Mockup"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted">
                    <UtensilsCrossed className="w-6 h-6 opacity-30" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SATU-SATUNYA TOMBOL AKSI: HANYA DI BAWAH FORM (Tidak ada duplikasi di header) */}
        <div className="lg:col-span-12 flex items-center justify-end gap-3 pt-6 border-t border-surface-border">
          <Link
            href={backUrl}
            className="px-5 py-2.5 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm font-bold text-ink hover:bg-surface-subtle transition-all shadow-2xs"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="btn-press inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-brand-hover transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isEditMode ? (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Simpan & Terbitkan Menu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
