import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =========================================================================
// TEMPLATE DAFTAR MENU KANTIN MINI
// =========================================================================
// Silakan edit atau tambahkan menu Anda pada array di bawah ini.
// - categoryName: Jika kategori belum ada di database, script akan otomatis membuatnya.
// - hasSauceModifier: Ubah true jika menu memiliki opsi varian (contoh: pilihan saus/level).
// =========================================================================

interface MenuItemInput {
  categoryName: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  isAvailable?: boolean;
  isBestSeller?: boolean;
  hasSauceModifier?: boolean;
  modifierName?: string;
  modifierOptions?: string[]; // contoh: ["Saus BBQ", "Saus Teriyaki", "Saus Sambal"]
}

export const menuList: MenuItemInput[] = [
  // --- CONTOH KATEGORI MAKANAN ---
  {
    categoryName: "Makanan",
    name: "Nasi Ayam Crispy",
    description: "Nasi pulen dengan ayam goreng renyah dan sambal khas",
    price: 18000,
    imageUrl: "/img/menu/sample.webp", // Ganti dengan URL foto atau link Supabase Storage
    isAvailable: true,
    isBestSeller: true,
    hasSauceModifier: false,
  },
  {
    categoryName: "Makanan",
    name: "Ayam Katsu Saus Spesial",
    description: "Fillet dada ayam renyah disiram saus gurih pilihan",
    price: 20000,
    imageUrl: "/img/menu/sample.webp",
    isAvailable: true,
    isBestSeller: true,
    hasSauceModifier: true,
    modifierName: "Pilihan Saus",
    modifierOptions: ["Saus BBQ", "Saus Blackpepper", "Saus Teriyaki"],
  },

  // --- CONTOH KATEGORI MINUMAN ---
  {
    categoryName: "Minuman",
    name: "Es Teh Manis",
    description: "Teh melati wangi dan segar manis pas",
    price: 5000,
    imageUrl: "/img/menu/sample.webp",
    isAvailable: true,
    isBestSeller: false,
    hasSauceModifier: false,
  },
  {
    categoryName: "Minuman",
    name: "Es Jeruk Peras",
    description: "Jeruk peras murni kaya vitamin C",
    price: 7000,
    imageUrl: "/img/menu/sample.webp",
    isAvailable: true,
    isBestSeller: false,
    hasSauceModifier: false,
  },

  // --- CONTOH KATEGORI CAMILAN ---
  {
    categoryName: "Camilan",
    name: "Kentang Goreng (French Fries)",
    description: "Kentang goreng gurih renyah dengan bumbu tabur",
    price: 12000,
    imageUrl: "/img/menu/sample.webp",
    isAvailable: true,
    isBestSeller: false,
    hasSauceModifier: true,
    modifierName: "Rasa Bumbu",
    modifierOptions: ["Barbeque", "Balado Pedas", "Keju Manis"],
  },
];

// Helper: buat slug dari nama kategori (contoh: "Makanan Berat" -> "makanan-berat")
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function addBulkMenus() {
  console.log(`🚀 Memulai import ${menuList.length} menu ke Supabase...`);

  // Cache kategori agar tidak bolak-balik query
  const categoryMap = new Map<string, string>();

  // 1. Ambil atau buat Kategori yang dibutuhkan
  for (const item of menuList) {
    const trimmedCat = item.categoryName.trim();
    if (!categoryMap.has(trimmedCat)) {
      const slug = slugify(trimmedCat);

      // Cari atau buat kategori secara otomatis
      let category = await prisma.category.findUnique({
        where: { slug },
      });

      if (!category) {
        console.log(`📁 Membuat kategori baru: "${trimmedCat}"`);
        // Hitung sortOrder terakhir
        const totalCategories = await prisma.category.count();
        category = await prisma.category.create({
          data: {
            name: trimmedCat,
            slug,
            sortOrder: totalCategories + 1,
          },
        });
      }

      categoryMap.set(trimmedCat, category.id);
    }
  }

  // 2. Masukkan menu items
  let addedCount = 0;
  let updatedCount = 0;

  for (const item of menuList) {
    const categoryId = categoryMap.get(item.categoryName.trim())!;

    // Cek apakah menu dengan nama ini sudah ada
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name.trim() },
    });

    const dataPayload = {
      categoryId,
      name: item.name.trim(),
      description: item.description?.trim() || null,
      price: item.price,
      imageUrl: item.imageUrl.trim(),
      isAvailable: item.isAvailable ?? true,
      isBestSeller: item.isBestSeller ?? false,
      hasSauceModifier: item.hasSauceModifier ?? false,
      modifierName: item.hasSauceModifier ? item.modifierName || "Pilihan" : null,
      modifierOptions:
        item.hasSauceModifier && item.modifierOptions
          ? JSON.stringify(item.modifierOptions)
          : null,
    };

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: dataPayload,
      });
      updatedCount++;
      console.log(`  🔄 Diperbarui: ${item.name}`);
    } else {
      await prisma.menuItem.create({
        data: dataPayload,
      });
      addedCount++;
      console.log(`  ➕ Ditambahkan: ${item.name}`);
    }
  }

  console.log("\n==========================================");
  console.log(`✅ Selesai! Berhasil memproses menu:`);
  console.log(`   - Menu baru ditambahkan: ${addedCount}`);
  console.log(`   - Menu lama diperbarui : ${updatedCount}`);
  console.log("==========================================\n");
}

addBulkMenus()
  .catch((err) => {
    console.error("❌ Error import menu:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
