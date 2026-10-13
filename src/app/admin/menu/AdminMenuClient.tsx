"use client";

import React, { useState, useRef, useTransition, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  ImageIcon,
  Check,
  X,
  AlertCircle,
  Flame,
  FolderPlus,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ListOrdered,
  GripVertical,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

interface CategoryType {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

interface MenuItemAdminType {
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
  category?: CategoryType;
}

interface AdminMenuClientProps {
  initialCategories?: CategoryType[];
  initialItems?: MenuItemAdminType[];
}

export default function AdminMenuClient({
  initialCategories = [],
  initialItems = [],
}: AdminMenuClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<MenuItemAdminType[]>(initialItems);
  const [categories, setCategories] = useState<CategoryType[]>(initialCategories);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modal State for Menu Item (Add / Edit)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItemAdminType | null>(null);

  // Menu Form Data
  const [formName, setFormName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formCategoryId, setFormCategoryId] = useState<string>(
    initialCategories[0]?.id || ""
  );
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formIsBestSeller, setFormIsBestSeller] = useState<boolean>(false);
  const [formHasModifier, setFormHasModifier] = useState<boolean>(false);
  const [formModifierName, setFormModifierName] = useState<string>("Pilihan Saus");
  const [formModifierOptions, setFormModifierOptions] = useState<string[]>([
    "Saus BBQ",
    "Saus Blackpepper",
    "Saus Sambal Matah",
    "Saus Curry",
  ]);
  const [newOptionInput, setNewOptionInput] = useState<string>("");
  const [formImageMode, setFormImageMode] = useState<"upload" | "url">("upload");
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isSubmittingMenu, setIsSubmittingMenu] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State for New Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deletingItem, setDeletingItem] = useState<MenuItemAdminType | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Reorder Categories Modal State
  const [isReorderCategoriesOpen, setIsReorderCategoriesOpen] = useState<boolean>(false);
  const [reorderedCategories, setReorderedCategories] = useState<CategoryType[]>([]);
  const [isSavingCategoryOrder, setIsSavingCategoryOrder] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch Menu & Categories (for manual refresh)
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/menu");
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data.categories || []);
        setItems(json.data.items || []);
        if (json.data.categories?.length > 0 && !formCategoryId) {
          setFormCategoryId(json.data.categories[0].id);
        }
      } else {
        showToast(json.error || "Gagal memuat data menu", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi saat memuat menu", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filtered Items (sorted by sortOrder asc)
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const cat = categories.find((c) => c.id === item.categoryId) || item.category;
        const matchesCategory =
          selectedCategorySlug === "all" ||
          cat?.slug === selectedCategorySlug ||
          item.category?.slug === selectedCategorySlug;

        const matchesSearch =
          !normalizedQuery ||
          item.name.toLowerCase().includes(normalizedQuery) ||
          (item.description &&
            item.description.toLowerCase().includes(normalizedQuery)) ||
          (cat && cat.name.toLowerCase().includes(normalizedQuery));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [items, categories, selectedCategorySlug, normalizedQuery]);

  // Displayed Categories (sorted by sortOrder asc)
  const displayedCategories = useMemo(() => {
    const sorted = [...categories].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
    const baseList =
      selectedCategorySlug === "all"
        ? sorted
        : sorted.filter((c) => c.slug === selectedCategorySlug);

    // Saat pencarian aktif, hanya tampilkan kategori yang memiliki menu yang cocok
    if (normalizedQuery) {
      return baseList.filter((cat) =>
        filteredItems.some((it) => it.categoryId === cat.id)
      );
    }

    return baseList;
  }, [categories, selectedCategorySlug, normalizedQuery, filteredItems]);

  // Drag and Drop state & handlers for menu items
  const [draggedMenuId, setDraggedMenuId] = useState<string | null>(null);
  const draggedMenuIdRef = useRef<string | null>(null);
  const draggedMenuCatIdRef = useRef<string | null>(null);
  const [isSavingReorder, setIsSavingReorder] = useState<boolean>(false);

  const clearMenuDragOverStyles = () => {
    document.querySelectorAll("[data-menu-row]").forEach((el) => {
      el.classList.remove(
        "border-brand",
        "ring-2",
        "ring-brand/40",
        "bg-brand-light/10"
      );
    });
  };

  const handleMenuDragStart = (e: React.DragEvent, id: string, catId: string) => {
    if (normalizedQuery) {
      e.preventDefault();
      return;
    }
    draggedMenuIdRef.current = id;
    draggedMenuCatIdRef.current = catId;
    setDraggedMenuId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.setData("application/x-menu-id", id);
    e.dataTransfer.setData("application/x-cat-id", catId);
  };

  const handleMenuDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleMenuDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    const row = (e.currentTarget as HTMLElement).closest("[data-menu-row]");
    if (row && row.getAttribute("data-menu-id") !== draggedMenuIdRef.current) {
      row.classList.add(
        "border-brand",
        "ring-2",
        "ring-brand/40",
        "bg-brand-light/10"
      );
    }
  };

  const handleMenuDragLeave = (e: React.DragEvent) => {
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      currentTarget.classList.remove(
        "border-brand",
        "ring-2",
        "ring-brand/40",
        "bg-brand-light/10"
      );
    }
  };

  const handleMenuDragEnd = () => {
    draggedMenuIdRef.current = null;
    draggedMenuCatIdRef.current = null;
    setDraggedMenuId(null);
    clearMenuDragOverStyles();
  };

  const handleMenuDrop = async (
    e: React.DragEvent,
    targetId: string,
    targetCategoryId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    clearMenuDragOverStyles();

    const sourceId =
      draggedMenuIdRef.current ||
      e.dataTransfer.getData("application/x-menu-id") ||
      e.dataTransfer.getData("text/plain") ||
      draggedMenuId;

    const sourceCatId =
      draggedMenuCatIdRef.current ||
      e.dataTransfer.getData("application/x-cat-id");

    handleMenuDragEnd();

    // Pastikan ID sumber dan target valid serta berbeda
    if (!sourceId || sourceId === targetId) {
      return;
    }

    // Hanya izinkan drop di kategori yang sama
    if (sourceCatId && sourceCatId !== targetCategoryId) {
      return;
    }

    // Hitung perubahan urutan secara sinkron dari state items saat ini
    const catItems = items
      .filter((i) => i.categoryId === targetCategoryId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const fromIndex = catItems.findIndex((i) => i.id === sourceId);
    const toIndex = catItems.findIndex((i) => i.id === targetId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    const reorderedList = [...catItems];
    const [movedItem] = reorderedList.splice(fromIndex, 1);
    reorderedList.splice(toIndex, 0, movedItem);

    const orderMap = new Map<string, number>();
    const payload = reorderedList.map((item, idx) => {
      const order = idx + 1;
      orderMap.set(item.id, order);
      return { id: item.id, sortOrder: order };
    });

    if (payload.length === 0) return;

    // Optimistic UI update
    setItems((prevItems) =>
      prevItems.map((item) => {
        const newOrder = orderMap.get(item.id);
        return newOrder !== undefined ? { ...item, sortOrder: newOrder } : item;
      })
    );

    // Auto-save perubahan urutan ke database
    try {
      setIsSavingReorder(true);
      const res = await fetch("/api/admin/menu/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      const json = await res.json();
      if (!json.success) {
        showToast(json.error || "Gagal menyimpan urutan menu.", "error");
      } else {
        showToast("Urutan menu berhasil disimpan!", "success");
        router.refresh();
      }
    } catch {
      showToast("Terjadi kesalahan koneksi saat menyimpan urutan.", "error");
    } finally {
      setIsSavingReorder(false);
    }
  };

  // Handle Quick Toggle Availability
  const handleToggleAvailability = async (item: MenuItemAdminType) => {
    const nextStatus = !item.isAvailable;
    // Optimistic UI update
    startTransition(() => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextStatus } : i))
      );
    });

    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        // Revert
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, isAvailable: item.isAvailable } : i
          )
        );
        showToast("Gagal mengubah status menu", "error");
      } else {
        showToast(
          `Status ${item.name} diubah menjadi ${nextStatus ? "Tersedia" : "Habis"}`
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isAvailable: item.isAvailable } : i
        )
      );
      showToast("Gagal menghubungi server", "error");
    }
  };

  // Helper for adding & removing modifier options
  const handleAddModifierOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (!formModifierOptions.includes(trimmed)) {
      setFormModifierOptions((prev) => [...prev, trimmed]);
    }
    setNewOptionInput("");
  };

  const handleRemoveModifierOption = (indexToRemove: number) => {
    setFormModifierOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleApplyModifierPreset = (name: string, options: string[]) => {
    setFormModifierName(name);
    setFormModifierOptions(options);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCategoryId(categories[0]?.id || "");
    setFormImageUrl("");
    setFormIsAvailable(true);
    setFormIsBestSeller(false);
    setFormHasModifier(false);
    setFormModifierName("Pilihan Saus");
    setFormModifierOptions([
      "Saus BBQ",
      "Saus Blackpepper",
      "Saus Sambal Matah",
      "Saus Curry",
    ]);
    setNewOptionInput("");
    setFormImageMode("upload");
    setFormError(null);
    setIsMenuModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MenuItemAdminType) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormPrice(item.price.toString());
    setFormCategoryId(item.categoryId);
    setFormImageUrl(item.imageUrl);
    setFormIsAvailable(item.isAvailable);
    setFormIsBestSeller(item.isBestSeller);
    setFormHasModifier(Boolean(item.hasSauceModifier));
    setFormModifierName(item.modifierName || "Pilihan Saus");

    let parsedOpts: string[] = [];
    if (item.modifierOptions) {
      try {
        const parsed = JSON.parse(item.modifierOptions);
        if (Array.isArray(parsed)) {
          parsedOpts = parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      } catch {
        parsedOpts = item.modifierOptions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (parsedOpts.length === 0 && item.hasSauceModifier) {
      parsedOpts = ["Saus BBQ", "Saus Blackpepper", "Saus Sambal Matah", "Saus Curry"];
    }
    setFormModifierOptions(parsedOpts);
    setNewOptionInput("");

    setFormImageMode(item.imageUrl.startsWith("/uploads/") ? "upload" : "url");
    setFormError(null);
    setIsMenuModalOpen(true);
  };

  // Handle File Upload to Server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setFormError("Hanya file foto PNG atau JPG (maksimal 6MB) yang diperbolehkan.");
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
        showToast("Foto berhasil diunggah & dikonversi ke WebP!");
      } else {
        setFormError(json.error || "Gagal mengunggah foto.");
      }
    } catch {
      setFormError("Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle Save Menu (Create or Update)
  const handleSaveMenu = async (e: React.FormEvent) => {
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
      setFormError("Silakan unggah foto menu atau masukkan URL foto.");
      return;
    }

    let finalOptions = [...formModifierOptions];
    if (newOptionInput.trim() && !finalOptions.includes(newOptionInput.trim())) {
      finalOptions.push(newOptionInput.trim());
    }

    if (formHasModifier) {
      if (!formModifierName.trim()) {
        setFormError("Silakan masukkan nama kustomisasi/modifier (contoh: Pilihan Saus).");
        return;
      }
      if (finalOptions.length === 0) {
        setFormError("Silakan tambahkan minimal 1 opsi varian (contoh: Saus BBQ).");
        return;
      }
    }

    try {
      setIsSubmittingMenu(true);
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

      if (editingItem) {
        // Update
        const res = await fetch(`/api/admin/menu/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setItems((prev) =>
            prev.map((item) => (item.id === editingItem.id ? json.data : item))
          );
          setIsMenuModalOpen(false);
          showToast(`Menu "${json.data.name}" berhasil diperbarui!`);
        } else {
          setFormError(json.error || "Gagal memperbarui menu.");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setItems((prev) => [json.data, ...prev]);
          setIsMenuModalOpen(false);
          showToast(`Menu "${json.data.name}" berhasil ditambahkan!`);
        } else {
          setFormError(json.error || "Gagal menambahkan menu.");
        }
      }
    } catch {
      setFormError("Terjadi kesalahan koneksi saat menyimpan menu.");
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  // Handle Delete Menu
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/menu/${deletingItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
        showToast(`Menu "${deletingItem.name}" berhasil dihapus.`);
        setDeletingItem(null);
      } else {
        showToast(json.error || "Gagal menghapus menu.", "error");
      }
    } catch {
      showToast("Kesalahan koneksi saat menghapus menu.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Add Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryError("Nama kategori tidak boleh kosong.");
      return;
    }

    try {
      setIsSubmittingCategory(true);
      setCategoryError(null);
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          sortOrder: categories.length + 1,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCategories((prev) => [...prev, json.data]);
        setFormCategoryId(json.data.id);
        setIsCategoryModalOpen(false);
        setNewCategoryName("");
        showToast(`Kategori "${json.data.name}" berhasil ditambahkan!`);
      } else {
        setCategoryError(json.error || "Gagal membuat kategori.");
      }
    } catch {
      setCategoryError("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Drag and Drop handlers for category modal
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const draggedCatIdRef = useRef<string | null>(null);

  const clearCatDragOverStyles = () => {
    document.querySelectorAll("[data-cat-row]").forEach((el) => {
      el.classList.remove(
        "border-brand",
        "ring-2",
        "ring-brand/40",
        "bg-brand-light/10"
      );
    });
  };

  const handleCatDragStart = (e: React.DragEvent, id: string) => {
    draggedCatIdRef.current = id;
    setDraggedCatId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleCatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCatDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    const row = (e.currentTarget as HTMLElement).closest("[data-cat-row]");
    if (row && row.getAttribute("data-cat-id") !== draggedCatIdRef.current) {
      row.classList.add(
        "border-brand",
        "ring-2",
        "ring-brand/40",
        "bg-brand-light/10"
      );
    }
  };

  const handleCatDragLeave = (e: React.DragEvent) => {
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      currentTarget.classList.remove(
        "border-brand",
        "ring-2",
        "ring-brand/40",
        "bg-brand-light/10"
      );
    }
  };

  const handleCatDragEnd = () => {
    draggedCatIdRef.current = null;
    setDraggedCatId(null);
    clearCatDragOverStyles();
  };

  const handleCatDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    clearCatDragOverStyles();

    const sourceId =
      draggedCatIdRef.current ||
      e.dataTransfer.getData("text/plain") ||
      draggedCatId;

    handleCatDragEnd();

    if (!sourceId || sourceId === targetId) {
      return;
    }

    setReorderedCategories((prev) => {
      const fromIndex = prev.findIndex((c) => c.id === sourceId);
      const toIndex = prev.findIndex((c) => c.id === targetId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prev;
      }

      const updated = [...prev];
      const [movedCat] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedCat);
      return updated;
    });
  };

  // Reorder Category Handlers
  const handleOpenReorderCategories = () => {
    const sorted = [...categories].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
    setReorderedCategories(sorted);
    setIsReorderCategoriesOpen(true);
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderedCategories.length) return;

    const updated = [...reorderedCategories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setReorderedCategories(updated);
  };

  const handleSaveCategoryOrder = async () => {
    try {
      setIsSavingCategoryOrder(true);
      const payload = reorderedCategories.map((cat, idx) => ({
        id: cat.id,
        sortOrder: idx + 1,
      }));

      const res = await fetch("/api/admin/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      const json = await res.json();
      if (json.success) {
        setCategories(
          reorderedCategories.map((cat, idx) => ({ ...cat, sortOrder: idx + 1 }))
        );
        showToast("Urutan kategori berhasil diperbarui!");
        setIsReorderCategoriesOpen(false);
      } else {
        showToast(json.error || "Gagal memperbarui urutan kategori.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsSavingCategoryOrder(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs md:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-0.5 rounded-md hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Header: Search, Add Buttons & Stats */}
      <div className="bg-surface rounded-2xl p-4 md:p-5 border border-surface-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-ink">
              Katalog Menu
            </h2>
            <p className="text-xs text-ink-muted">
              Total {items.length} menu makanan & minuman terdaftar.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="btn-press inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm font-bold text-ink hover:text-brand hover:border-brand/40 transition-all cursor-pointer shadow-2xs"
              title="Refresh Data Menu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenReorderCategories}
              disabled={categories.length <= 1}
              className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm font-bold text-ink hover:text-brand hover:border-brand/40 transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              title="Atur urutan posisi kategori"
            >
              <ListOrdered className="w-4 h-4 text-brand" />
              <span>Urutkan Kategori</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-brand-light text-brand border border-brand/25 hover:bg-brand-light/80 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>

            <Link
              href={`${pathname}/create`}
              prefetch={true}
              className="btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-brand-hover transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu</span>
            </Link>
          </div>
        </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau deskripsi menu..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-xs md:text-sm bg-white border border-surface-border placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-medium"
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategorySlug("all")}
              className={`btn-press px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategorySlug === "all"
                  ? "bg-brand text-white shadow-2xs"
                  : "bg-surface-subtle text-ink-muted hover:text-ink hover:bg-surface-border/50 border border-surface-border/60"
              }`}
            >
              Semua ({items.length})
            </button>

            {categories.map((cat) => {
              const count = items.filter((i) => i.categoryId === cat.id).length;
              const isActive = selectedCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`btn-press px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-brand text-white shadow-2xs"
                      : "bg-surface-subtle text-ink-muted hover:text-ink hover:bg-surface-border/50 border border-surface-border/60"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <span className="text-xs font-semibold text-ink-muted">
              Memuat katalog menu...
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-surface rounded-2xl border border-surface-border p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center mx-auto text-ink-muted border border-surface-border">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm md:text-base text-ink">
              Tidak ada menu ditemukan
            </h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada menu yang sesuai dengan pencarian "${searchQuery}".`
                : "Belum ada menu di kategori ini. Klik tombol tambah menu untuk membuat menu baru."}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
                <span>Reset Pencarian</span>
              </button>
            ) : (
              <Link
                href={`${pathname}/create`}
                className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand-hover transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Pertama</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Drag & Drop Help Hint or Search Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1 text-xs text-ink-muted">
              {normalizedQuery ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-surface-border font-semibold text-ink">
                    <Search className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span>
                      Ditemukan <strong>{filteredItems.length}</strong> menu untuk pencarian &quot;{searchQuery}&quot;
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-brand hover:underline font-bold text-xs cursor-pointer"
                  >
                    Bersihkan
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1.5">
                  <GripVertical className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>
                    Tahan & drag ikon <strong>(⋮⋮)</strong> untuk mengatur urutan menu di dalam kategorinya. Untuk mengubah urutan kategori, klik tombol <strong>Urutkan Kategori</strong> di atas.
                  </span>
                </span>
              )}
              {isSavingReorder && (
                <span className="flex items-center gap-1 text-brand font-semibold animate-pulse shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan urutan...</span>
                </span>
              )}
            </div>

            {/* Category Groups */}
            <div className="space-y-5">
              {displayedCategories.map((cat, catIdx) => {
                const catItems = filteredItems
                  .filter((it) => it.categoryId === cat.id)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                return (
                  <div
                    key={cat.id}
                    className="bg-surface rounded-2xl border border-surface-border shadow-xs overflow-hidden"
                  >
                    {/* Category Header (Urutan kategori diatur melalui tombol Urutkan Kategori) */}
                    <div className="p-3.5 md:px-5 border-b border-surface-border bg-surface-subtle/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-surface border border-surface-border text-brand text-xs font-black flex items-center justify-center shrink-0">
                          {catIdx + 1}
                        </span>
                        <h2 className="font-extrabold text-base md:text-lg text-ink truncate">
                          {cat.name}
                        </h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-light text-brand shrink-0">
                          {catItems.length} Menu
                        </span>
                      </div>
                    </div>

                    {/* Menu Items List inside this Category */}
                    <div className="p-3 md:p-4 space-y-2">
                      {catItems.length === 0 ? (
                        <div className="py-6 text-center text-xs text-ink-muted">
                          Belum ada menu di kategori ini.
                        </div>
                      ) : (
                        catItems.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            data-menu-row
                            data-menu-id={item.id}
                            draggable={!normalizedQuery}
                            onDragStart={(e) => handleMenuDragStart(e, item.id, cat.id)}
                            onDragOver={handleMenuDragOver}
                            onDragEnter={handleMenuDragEnter}
                            onDragLeave={handleMenuDragLeave}
                            onDragEnd={handleMenuDragEnd}
                            onDrop={(e) => handleMenuDrop(e, item.id, cat.id)}
                            className={`group bg-surface rounded-xl border border-surface-border transition-all p-3 flex items-center justify-between gap-3 select-none ${
                              draggedMenuId === item.id
                                ? "opacity-30 border-dashed border-brand bg-brand-light/30 scale-[0.99]"
                                : "hover:border-brand/40 shadow-xs hover:shadow-sm"
                            }`}
                          >
                            {/* Drag Handle & Order Number */}
                            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                              <div
                                className={`p-1 rounded-md text-ink-muted transition-colors ${
                                  normalizedQuery
                                    ? "opacity-30 cursor-not-allowed"
                                    : "group-hover:text-brand hover:bg-surface-subtle cursor-grab active:cursor-grabbing"
                                }`}
                                title={
                                  normalizedQuery
                                    ? "Urutan menu dinonaktifkan saat pencarian aktif"
                                    : "Klik & drag untuk ubah posisi menu dalam kategori ini"
                                }
                              >
                                <GripVertical className="w-4 h-4 md:w-5 md:h-5 pointer-events-none" />
                              </div>
                              <span className="w-6 text-center text-xs font-black text-brand shrink-0 select-none">
                                #{itemIdx + 1}
                              </span>
                            </div>

                            {/* Foto Menu Kecil */}
                            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-surface border border-surface-border/60 shrink-0 flex items-center justify-center pointer-events-none select-none">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                sizes="56px"
                                draggable={false}
                                className="object-contain p-1 pointer-events-none select-none"
                              />
                              {!item.isAvailable && (
                                <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="text-[9px] font-black text-white px-1 py-0.5 rounded bg-black/60">
                                    HABIS
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Info Menu */}
                            <div className="flex-1 min-w-0 pointer-events-none select-none">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm md:text-base text-ink truncate leading-tight">
                                  {item.name}
                                </h3>
                                {item.isBestSeller && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-0.5 shadow-xs">
                                    <Flame className="w-2.5 h-2.5 fill-white" />
                                    <span>Best</span>
                                  </span>
                                )}
                                {item.hasSauceModifier && (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/60 inline-flex items-center gap-1">
                                    <span>⚙</span>
                                    <span>{item.modifierName || "Kustomisasi"}</span>
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-ink-muted line-clamp-1 mt-0.5 font-normal">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Harga */}
                            <div className="text-right shrink-0 px-1 md:px-3 pointer-events-none select-none">
                              <span className="font-extrabold text-sm md:text-base text-ink whitespace-nowrap">
                                Rp {item.price.toLocaleString("id-ID")}
                              </span>
                            </div>

                            {/* Toggle Ketersediaan (Real Switch Toggle) */}
                            <div className="shrink-0 flex items-center gap-2 pointer-events-auto">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={item.isAvailable}
                                onClick={() => handleToggleAvailability(item)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand ${
                                  item.isAvailable
                                    ? "bg-emerald-500"
                                    : "bg-surface-border hover:bg-ink-muted/30"
                                }`}
                                title={`Status: ${
                                  item.isAvailable ? "Tersedia" : "Habis"
                                } (Klik untuk ubah)`}
                              >
                                <span className="sr-only">Toggle ketersediaan</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    item.isAvailable ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                              <span
                                className={`text-xs font-bold select-none hidden sm:inline-block w-14 ${
                                  item.isAvailable ? "text-emerald-700" : "text-rose-600"
                                }`}
                              >
                                {item.isAvailable ? "Tersedia" : "Habis"}
                              </span>
                            </div>

                            {/* Tombol Edit & Hapus */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Link
                                href={`${pathname}/${item.id}/edit`}
                                prefetch={true}
                                className="btn-press p-2 rounded-xl bg-surface border border-surface-border text-ink hover:text-brand hover:border-brand/40 shadow-2xs transition-colors cursor-pointer"
                                title="Edit Menu"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="btn-press p-2 rounded-xl bg-surface border border-surface-border text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-2xs transition-colors cursor-pointer"
                                title="Hapus Menu"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Modal: Tambah / Edit Menu sudah dialihkan ke halaman tersendiri dengan breadcrumb */}
      {false && isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/65 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl lg:max-w-5xl bg-surface rounded-2xl md:rounded-3xl border border-surface-border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-surface-border bg-surface shrink-0">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-black text-ink flex items-center gap-2.5">
                  <span>{editingItem ? "Edit Menu" : "Tambah Menu Baru"}</span>
                  {editingItem && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-light text-brand">
                      {editingItem?.category?.name || "Kantin Mini"}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Atur detail menu, harga, ketersediaan, dan konfigurasi kustomisasi/modifier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner jika ada */}
            {formError && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shrink-0">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span className="leading-snug">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMenu} className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-7 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* KOLOM KIRI (Info Menu, Foto, Kategori, Harga, Status) */}
                <div className="lg:col-span-6 space-y-5">
                  
                  {/* Foto Menu */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-ink">
                        Foto Menu <span className="text-rose-500">*</span>
                      </label>
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
                          className="border-2 border-dashed border-surface-border hover:border-brand rounded-2xl p-4 text-center cursor-pointer transition-all bg-surface-subtle/50 hover:bg-brand-light/20 flex flex-col items-center justify-center gap-2.5 min-h-[140px]"
                        >
                          {formImageUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative w-36 h-28 rounded-xl overflow-hidden border border-surface-border shadow-xs bg-white">
                                <Image
                                  src={formImageUrl}
                                  alt="Preview Menu"
                                  fill
                                  className="object-contain p-1.5"
                                />
                              </div>
                              <span className="text-xs font-bold text-brand hover:underline">
                                Ganti Foto
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="w-11 h-11 rounded-2xl bg-brand-light flex items-center justify-center text-brand shadow-xs">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div>
                                {isUploadingImage ? (
                                  <div className="flex items-center justify-center gap-2 text-xs text-brand font-bold">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Mengunggah & mengonversi foto...</span>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-xs sm:text-sm font-bold text-brand block">
                                      Pilih Foto Menu Dari Perangkat
                                    </span>
                                    <span className="text-[11px] text-ink-muted block mt-0.5">
                                      PNG, JPG, WebP transparan atau latar polos (Maks 6MB)
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
                          placeholder="https://example.com/foto-menu.webp"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-border text-xs sm:text-sm font-medium focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                        />
                        {formImageUrl && (
                          <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-surface-border bg-white p-1">
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

                  {/* Nama Menu */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-ink">
                      Nama Menu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Chicken Katsu BBQ / Es Teh Manis"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-border text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>

                  {/* Kategori & Harga Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Kategori */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-ink">
                        Kategori <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formCategoryId}
                        onChange={(e) => setFormCategoryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-border text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Harga */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-ink">
                        Harga Jual (Rp) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="25000"
                        min="0"
                        step="500"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-border text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Deskripsi Menu */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-ink">
                      Deskripsi Singkat (Opsional)
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Jelaskan isi porsi, bahan utama, atau cita rasa menu..."
                      rows={2}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-border text-xs sm:text-sm font-medium focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                    />
                  </div>

                  {/* Pengaturan Status Ketersediaan & Best Seller */}
                  <div className="p-3.5 rounded-2xl bg-surface-subtle/50 border border-surface-border space-y-3">
                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <div>
                        <span className="font-bold text-ink text-xs sm:text-sm block">
                          Status Ketersediaan
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {formIsAvailable ? "Menu dapat dipesan pelanggan & kasir" : "Menu ditandai HABIS"}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formIsAvailable}
                        onChange={(e) => setFormIsAvailable(e.target.checked)}
                        className="w-5 h-5 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                      />
                    </label>

                    <div className="border-t border-surface-border/60" />

                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <div>
                        <span className="font-bold text-ink text-xs sm:text-sm flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>Menu Best Seller</span>
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          Tampilkan badge rekomendasi &ldquo;Best Seller&rdquo; pada menu
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

                {/* KOLOM KANAN (Kustomisasi / Modifier Opsi Menu) */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle/70 border border-surface-border space-y-4">
                    
                    {/* Header Modifier Section */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center text-brand">
                            <SlidersHorizontal className="w-4 h-4" />
                          </div>
                          <h3 className="font-black text-sm sm:text-base text-ink">
                            Kustomisasi & Modifier
                          </h3>
                        </div>
                        <p className="text-xs text-ink-muted mt-1">
                          Aktifkan jika menu memerlukan pilihan varian dari pelanggan (misal: saus, level pedas, es/manis).
                        </p>
                      </div>

                      {/* Switch On/Off Modifier */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formHasModifier}
                        onClick={() => setFormHasModifier((prev) => !prev)}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          formHasModifier ? "bg-brand" : "bg-surface-border"
                        }`}
                        title="Aktifkan atau matikan kustomisasi untuk menu ini"
                      >
                        <span className="sr-only">Toggle kustomisasi</span>
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            formHasModifier ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {formHasModifier ? (
                      <div className="space-y-4 pt-2 border-t border-surface-border/70 animate-in fade-in duration-200">
                        {/* Nama Modifier */}
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-bold text-ink">
                            Nama Kustomisasi / Modifier <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formModifierName}
                            onChange={(e) => setFormModifierName(e.target.value)}
                            placeholder="Contoh: Pilihan Saus / Tingkat Kepedasan / Level Es"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-border text-xs sm:text-sm font-bold focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                          />
                          <p className="text-[11px] text-ink-muted">
                            Judul ini yang akan dibaca oleh pembeli saat memilih varian.
                          </p>
                        </div>

                        {/* Template Preset Cepat */}
                        <div className="space-y-2">
                          <label className="text-xs font-extrabold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand" />
                            <span>Template Pilihan Cepat:</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
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
                              className="btn-press px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm font-bold text-ink hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                            >
                              + Saus Katsu (4 Saus)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyModifierPreset("Tingkat Kepedasan", [
                                  "Level 0 (Tidak Pedas)",
                                  "Level 1 (Sedang)",
                                  "Level 2 (Pedas)",
                                  "Level 3 (Extra Pedas)",
                                ])
                              }
                              className="btn-press px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm font-bold text-ink hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                            >
                              + Level Pedas (0 - 3)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleApplyModifierPreset("Pilihan Es & Manis", [
                                  "Normal Ice & Sugar",
                                  "Less Sugar",
                                  "Less Ice",
                                  "No Ice (Hangat/Biasa)",
                                ])
                              }
                              className="btn-press px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-xs sm:text-sm font-bold text-ink hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                            >
                              + Es & Manis (Minuman)
                            </button>
                          </div>
                        </div>

                        {/* Daftar Pilihan Opsi */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs sm:text-sm font-bold text-ink">
                              Daftar Pilihan Varian:
                            </label>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-light text-brand">
                              {formModifierOptions.length} varian aktif
                            </span>
                          </div>

                          {formModifierOptions.length === 0 ? (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                              Belum ada pilihan varian. Tambahkan minimal 1 varian menggunakan input di bawah.
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-white border border-surface-border max-h-48 overflow-y-auto shadow-2xs">
                              {formModifierOptions.map((opt, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-xs sm:text-sm font-bold text-ink group hover:border-brand/30 transition-all shadow-2xs"
                                >
                                  <span>{opt}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveModifierOption(idx)}
                                    className="p-1 rounded-md text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title={`Hapus varian "${opt}"`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Input Tambah Opsi Baru */}
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
                              placeholder="Ketik nama varian baru lalu tekan Enter / Tambah..."
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-surface-border text-xs sm:text-sm font-medium focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                            />
                            <button
                              type="button"
                              onClick={handleAddModifierOption}
                              disabled={!newOptionInput.trim()}
                              className="btn-press px-4 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-brand-hover transition-colors disabled:opacity-40 cursor-pointer shrink-0 flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Tambah</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Kustomisasi Nonaktif State */
                      <div className="py-8 px-4 rounded-xl border border-dashed border-surface-border bg-white text-center space-y-2.5">
                        <div className="w-10 h-10 rounded-full bg-surface-subtle mx-auto flex items-center justify-center text-ink-muted">
                          <SlidersHorizontal className="w-5 h-5 opacity-50" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-ink">
                          Kustomisasi Sedang Dinonaktifkan
                        </h4>
                        <p className="text-xs text-ink-muted max-w-xs mx-auto">
                          Menu ini akan dipesan langsung tanpa popup pilihan varian atau saus.
                        </p>
                        <button
                          type="button"
                          onClick={() => setFormHasModifier(true)}
                          className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-light text-brand text-xs sm:text-sm font-bold border border-brand/20 hover:bg-brand-light/80 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Aktifkan Kustomisasi Menu</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons / Footer Action */}
              <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="btn-press px-5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm font-bold text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMenu || isUploadingImage}
                  className="btn-press px-6 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingMenu ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Menu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Kategori Baru */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface rounded-2xl p-5 border border-surface-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="font-bold text-sm md:text-base text-ink">
                Tambah Kategori Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-ink-muted hover:bg-surface-subtle cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{categoryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Contoh: Camilan & Snack"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-border focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 font-semibold text-xs md:text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="btn-press flex-1 py-2 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="btn-press flex-1 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCategory ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Tambah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Menu */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-surface rounded-2xl p-5 border border-surface-border shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-ink">Hapus Menu Ini?</h3>
              <p className="text-xs text-ink-muted mt-1">
                Menu &ldquo;<span className="font-semibold text-ink">{deletingItem.name}</span>&rdquo; akan dihapus secara permanen dari katalog menu.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="btn-press flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="btn-press flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Hapus Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Atur Urutan Kategori */}
      {isReorderCategoriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-2xl p-5 md:p-6 border border-surface-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border shrink-0">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-base text-ink">
                  Atur Urutan Kategori
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReorderCategoriesOpen(false)}
                className="p-1 rounded-full text-ink-muted hover:bg-surface-subtle cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ink-muted shrink-0">
              Gunakan tombol panah Naik / Turun untuk memindahkan urutan kategori. Posisi teratas akan ditampilkan paling awal pada web pelanggan.
            </p>

            {/* List Kategori Reorder */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {reorderedCategories.map((cat, idx) => {
                const count = items.filter((i) => i.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    data-cat-row
                    data-cat-id={cat.id}
                    draggable
                    onDragStart={(e) => handleCatDragStart(e, cat.id)}
                    onDragOver={handleCatDragOver}
                    onDragEnter={handleCatDragEnter}
                    onDragLeave={handleCatDragLeave}
                    onDragEnd={handleCatDragEnd}
                    onDrop={(e) => handleCatDrop(e, cat.id)}
                    className={`p-3 rounded-xl border border-surface-border bg-surface-subtle/70 flex items-center justify-between gap-3 select-none transition-all hover:border-brand/40 ${
                      draggedCatId === cat.id
                        ? "opacity-30 border-dashed border-brand bg-brand-light/30"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="p-1 rounded-md text-ink-muted hover:text-brand cursor-grab active:cursor-grabbing transition-colors"
                        title="Tahan & drag untuk geser posisi"
                      >
                        <GripVertical className="w-4 h-4 pointer-events-none" />
                      </div>
                      <span className="w-6 h-6 rounded-lg bg-surface border border-surface-border text-[11px] font-black text-brand flex items-center justify-center shrink-0 select-none">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 pointer-events-none select-none">
                        <h4 className="font-bold text-xs text-ink truncate">
                          {cat.name}
                        </h4>
                        <span className="text-[10px] text-ink-muted">
                          {count} menu
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(idx, "up")}
                        disabled={idx === 0}
                        className="btn-press p-1.5 rounded-lg bg-surface border border-surface-border text-ink hover:bg-surface-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Geser Naik"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(idx, "down")}
                        disabled={idx === reorderedCategories.length - 1}
                        className="btn-press p-1.5 rounded-lg bg-surface border border-surface-border text-ink hover:bg-surface-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Geser Turun"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-2 border-t border-surface-border shrink-0">
              <button
                type="button"
                onClick={() => setIsReorderCategoriesOpen(false)}
                className="btn-press flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingCategoryOrder}
                onClick={handleSaveCategoryOrder}
                className="btn-press flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSavingCategoryOrder ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Simpan Urutan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
