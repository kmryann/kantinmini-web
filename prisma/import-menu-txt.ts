import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RawMenuItem {
  id?: number;
  nama: string;
  kategori: string;
  harga: number;
  deskripsi?: string;
  foto?: string;
}

// Data dari menu.txt
const MENU_DATA: RawMenuItem[] = [
  {
    nama: "Chicken Katsu",
    kategori: "Paket Nasi",
    harga: 16000,
    deskripsi: "Nasi + chicken katsu dengan pilihan saus gurih.",
  },
  {
    nama: "Katsu Lada Garam",
    kategori: "Paket Nasi",
    harga: 16000,
    deskripsi: "Chicken katsu dengan bumbu lada garam gurih",
  },
  {
    nama: "Katsu Kari",
    kategori: "Paket Nasi",
    harga: 17500,
    deskripsi: "Chicken katsu saus kari",
  },
  {
    nama: "Katsu Sambal Matah",
    kategori: "Paket Nasi",
    harga: 16000,
    deskripsi: "Chicken katsu sambal matah pedas segar",
  },
  {
    nama: "Ayam Geprek",
    kategori: "Paket Nasi",
    harga: 19000,
    deskripsi: "Ayam crispy digeprek sambal bawang",
  },
  {
    nama: "Ayam Bakar",
    kategori: "Paket Nasi",
    harga: 19000,
    deskripsi: "Ayam bakar bumbu manis gurih + tahu tempe",
  },
  {
    nama: "Ayam Penyet",
    kategori: "Paket Nasi",
    harga: 19000,
    deskripsi: "Ayam goreng penyet sambal pedas + tahu tempe",
  },
  {
    nama: "Ayam Kalasan",
    kategori: "Paket Nasi",
    harga: 19000,
    deskripsi: "Ayam goreng bumbu kalasan + tahu tempe",
  },
  {
    nama: "Ayam Kremes",
    kategori: "Paket Nasi",
    harga: 19000,
    deskripsi: "Ayam goreng renyah dengan kremesan gurih + tahu tempe",
  },
  {
    nama: "Ayam Pedas Daun Jeruk",
    kategori: "Paket Nasi",
    harga: 16000,
    deskripsi: "Ayam pedas wangi daun jeruk segar",
  },
  {
    nama: "Ayam Teriyaki",
    kategori: "Paket Nasi",
    harga: 16000,
    deskripsi: "Ayam saus teriyaki manis gurih",
  },
  {
    nama: "Ayam Lada Hitam",
    kategori: "Paket Nasi",
    harga: 16000,
    deskripsi: "Ayam saus lada hitam gurih",
  },
  {
    nama: "Chicken Wing",
    kategori: "Paket Nasi",
    harga: 22000,
    deskripsi: "Chicken wing bumbu saus dengan nasi",
  },
  {
    nama: "Sapi Lada Hitam",
    kategori: "Paket Nasi",
    harga: 19000,
    deskripsi: "Daging sapi empuk saus lada hitam",
  },
  {
    nama: "Sosis Asam Manis",
    kategori: "Paket Nasi",
    harga: 16000,
    deskripsi: "Pilihan saus: Asam Manis/Lada Hitam",
  },
  {
    nama: "Nasi Goreng Kecap",
    kategori: "Paket Nasi",
    harga: 17000,
    deskripsi: "Nasi goreng kecap spesial",
  },
  {
    nama: "Nasi Goreng Putih",
    kategori: "Paket Nasi",
    harga: 17000,
    deskripsi: "Nasi goreng putih spesial",
  },
  {
    nama: "Nasi Goreng Cikur",
    kategori: "Paket Nasi",
    harga: 15000,
    deskripsi: "Nasi goreng cikur harum + telor, mendoan",
  },
  {
    nama: "Kentang Katsu",
    kategori: "Light Bites",
    harga: 17000,
    deskripsi: "Kentang katsu renyah dengan pilihan saus.",
  },
  {
    nama: "Kentang Sosis",
    kategori: "Light Bites",
    harga: 15000,
    deskripsi: "Kentang goreng dengan sosis gurih",
  },
  {
    nama: "Mie Tektek",
    kategori: "Mie & Pasta",
    harga: 16000,
    deskripsi: "Mie goreng pedas gurih ala kaki lima",
  },
  {
    nama: "Kwetiau Goreng",
    kategori: "Mie & Pasta",
    harga: 16000,
    deskripsi: "Kwetiau goreng spesial",
  },
  {
    nama: "Kwetiau Kuah",
    kategori: "Mie & Pasta",
    harga: 16000,
    deskripsi: "Kwetiau kuah gurih",
  },
  {
    nama: "Kapal Selam Besar",
    kategori: "Pempek",
    harga: 15000,
    deskripsi: "Pempek besar isi telur dengan cuko segar",
  },
  {
    nama: "Lenjer Besar",
    kategori: "Pempek",
    harga: 15000,
    deskripsi: "Pempek tenggiri panjang besar kenyal gurih",
  },
  {
    nama: "Pempek Kecil Isi 3",
    kategori: "Pempek",
    harga: 15000,
    deskripsi: "Isi 3 sejenis atau campur (kapal selam, lenjer, adaan, kulit) dengan cuko segar",
  },
  {
    nama: "Model",
    kategori: "Pempek",
    harga: 15000,
    deskripsi: "Pempek isi tahu kuah kaldu gurih",
  },
  {
    nama: "Tekwan",
    kategori: "Pempek",
    harga: 15000,
    deskripsi: "Sup tekwan tenggiri kuah bening gurih",
  },
  {
    nama: "Lenggang",
    kategori: "Pempek",
    harga: 15000,
    deskripsi: "Pempek panggang telur dadar khas Palembang",
  },
  {
    nama: "Ayam Besar",
    kategori: "Kapten Chicken",
    harga: 8500,
    deskripsi: "Dada/Paha Atas",
  },
  {
    nama: "Ayam Kecil",
    kategori: "Kapten Chicken",
    harga: 7500,
    deskripsi: "Sayap/Paha Bawah",
  },
  {
    nama: "Kulit Ayam",
    kategori: "Kapten Chicken",
    harga: 5000,
    deskripsi: "Kulit ayam goreng garing gurih",
  },
  {
    nama: "Milo",
    kategori: "Minuman",
    harga: 6000,
    deskripsi: "Milo panas atau dingin",
  },
  {
    nama: "Teh Tarik",
    kategori: "Minuman",
    harga: 5000,
    deskripsi: "Teh tarik manis panas atau dingin",
  },
  {
    nama: "Lemon Tea",
    kategori: "Minuman",
    harga: 4000,
    deskripsi: "Teh manis lemon segar dingin",
  },
  {
    nama: "Nutrisari",
    kategori: "Minuman",
    harga: 4000,
    deskripsi: "Aneka rasa Nutrisari segar dingin",
  },
  {
    nama: "Kopi",
    kategori: "Minuman",
    harga: 5000,
    deskripsi: "Kopi hitam manis panas atau dingin",
  },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log(`🚀 Memproses import ${MENU_DATA.length} menu dari menu.txt ke Supabase...`);

  // Urutan kategori yang diinginkan
  const categoryOrder = [
    "Paket Nasi",
    "Light Bites",
    "Mie & Pasta",
    "Pempek",
    "Kapten Chicken",
    "Minuman",
  ];

  const categoryMap = new Map<string, string>();

  for (let i = 0; i < categoryOrder.length; i++) {
    const catName = categoryOrder[i];
    const slug = slugify(catName);

    let category = await prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: catName,
          slug,
          sortOrder: i + 1,
        },
      });
      console.log(`📁 Kategori dibuat: "${catName}" (Urutan: ${i + 1})`);
    } else {
      category = await prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: i + 1, name: catName },
      });
    }

    categoryMap.set(catName, category.id);
  }

  // Masukkan menu items (modifier false, image placeholder sementara)
  let count = 0;
  for (let idx = 0; idx < MENU_DATA.length; idx++) {
    const item = MENU_DATA[idx];
    const categoryId = categoryMap.get(item.kategori);

    if (!categoryId) {
      console.warn(`⚠️ Kategori tidak ditemukan untuk menu: ${item.nama}`);
      continue;
    }

    // Gunakan placeholder svg/logo atau icon bawaan
    const defaultImage = "/logo-kantinmini.svg";

    await prisma.menuItem.create({
      data: {
        categoryId,
        name: item.nama.trim(),
        description: item.deskripsi?.trim() || null,
        price: item.harga,
        imageUrl: defaultImage,
        isAvailable: true,
        isBestSeller: false,
        hasSauceModifier: false,
        modifierName: null,
        modifierOptions: null,
        sortOrder: idx + 1,
      },
    });

    count++;
    console.log(`  [${count}/${MENU_DATA.length}] ✅ Ditambahkan: ${item.nama} (Rp ${item.harga.toLocaleString("id-ID")})`);
  }

  console.log("\n========================================================");
  console.log(`🎉 Berhasil memasukkan ${count} menu ke Supabase!`);
  console.log("   - Semua modifier di-set: false");
  console.log("   - Foto placeholder di-set: /logo-kantinmini.svg (bisa Anda upload sendiri di web)");
  console.log("========================================================\n");
}

main()
  .catch((err) => {
    console.error("❌ Error saat import menu:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
