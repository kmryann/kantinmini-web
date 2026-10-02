import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Kantin Mini database seeding...");

  // 1. Seed 7 Meja Kantin Mini
  console.log("Seeding Dining Tables (1..7)...");
  for (let i = 1; i <= 7; i++) {
    await prisma.diningTable.upsert({
      where: { tableNumber: i },
      update: {},
      create: {
        tableNumber: i,
        status: "AVAILABLE",
      },
    });
  }

  // 2. Seed Default Staff & Admin Users
  console.log("Seeding Default Users...");
  await prisma.user.upsert({
    where: { email: "admin@kantinmini.com" },
    update: {},
    create: {
      name: "Owner / Admin",
      email: "admin@kantinmini.com",
      username: "admin",
      passwordHash: "admin123", // In production should be bcrypt hash
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@kantinmini.com" },
    update: {},
    create: {
      name: "Supervisor Manager",
      email: "manager@kantinmini.com",
      username: "manager",
      passwordHash: "manager123",
      pinHash: "8888", // Supervisor Override PIN
      role: "MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir1" },
    update: {},
    create: {
      name: "Kasir Operasional",
      username: "kasir1",
      passwordHash: "kasir123",
      pinHash: "1234", // Fast Cashier PIN
      role: "CASHIER",
    },
  });

  // 3. Seed Menu Categories
  console.log("Seeding Categories...");
  const categories = [
    { name: "Ayam & Katsu", slug: "ayam-katsu", sortOrder: 1 },
    { name: "Pempek", slug: "pempek", sortOrder: 2 },
    { name: "Mie, Kwetiau & Nasi Goreng", slug: "mie-nasgor", sortOrder: 3 },
    { name: "Minuman", slug: "minuman", sortOrder: 4 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }

  // 4. Seed Starter Menu Items
  console.log("Seeding Menu Items...");
  const menuItems = [
    // Ayam & Katsu
    {
      name: "Chicken Katsu Original",
      slug: "ayam-katsu",
      description: "Dada ayam renyah keemasan disajikan dengan nasi hangat dan pilihan saus spesial.",
      price: 24000,
      imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
      isBestSeller: true,
      hasSauceModifier: true,
    },
    {
      name: "Chicken Katsu Curry",
      slug: "ayam-katsu",
      description: "Chicken katsu dengan siraman kuah kari kental khas Jepang yang gurih dan harum.",
      price: 27000,
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
      isBestSeller: false,
      hasSauceModifier: true,
    },
    {
      name: "Ayam Geprek Sambal Bawang",
      slug: "ayam-katsu",
      description: "Ayam goreng tepung digeprek dengan sambal bawang pedas nampol dan lalapan segar.",
      price: 22000,
      imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      isBestSeller: true,
      hasSauceModifier: false,
    },
    // Pempek
    {
      name: "Pempek Kapal Selam",
      slug: "pempek",
      description: "Pempek ikan tenggiri asli dengan isian telur utuh disajikan bersama cuko kental khas Palembang.",
      price: 18000,
      imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      isBestSeller: true,
      hasSauceModifier: false,
    },
    {
      name: "Pempek Lenjer & Kulit Campur",
      slug: "pempek",
      description: "Kombinasi pempek lenjer kenyal dan pempek kulit renyah gurih dengan cuko pedas manis.",
      price: 16000,
      imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      isBestSeller: false,
      hasSauceModifier: false,
    },
    // Mie, Kwetiau & Nasi Goreng
    {
      name: "Nasi Goreng Spesial Kantin",
      slug: "mie-nasgor",
      description: "Nasi goreng bumbu racikan khas dengan suwiran ayam, bakso, telur mata sapi, dan acar kerupuk.",
      price: 23000,
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
      isBestSeller: true,
      hasSauceModifier: false,
    },
    {
      name: "Kwetiau Goreng Seafood",
      slug: "mie-nasgor",
      description: "Kwetiau beras lembut digoreng dengan udang segar, cumi, tauge, dan sawi manis beraroma smokey.",
      price: 25000,
      imageUrl: "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80",
      isBestSeller: false,
      hasSauceModifier: false,
    },
    {
      name: "Mie Goreng Jawa",
      slug: "mie-nasgor",
      description: "Mie kuning basah dengan bumbu kemiri khas Jawa, telur orak-arik, dan sayuran renyah.",
      price: 21000,
      imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80",
      isBestSeller: false,
      hasSauceModifier: false,
    },
    // Minuman
    {
      name: "Es Teh Manis Melati",
      slug: "minuman",
      description: "Seduhan teh melati wangi dengan rasa manis pas menyegarkan dahaga.",
      price: 5000,
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
      isBestSeller: true,
      hasSauceModifier: false,
    },
    {
      name: "Es Jeruk Peras Murni",
      slug: "minuman",
      description: "Jeruk peras segar alami kaya vitamin C disajikan dingin.",
      price: 9000,
      imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
      isBestSeller: false,
      hasSauceModifier: false,
    },
    {
      name: "Kopi Susu Gula Aren",
      slug: "minuman",
      description: "Espresso robusta mantap dipadu susu segar creamy dan gula aren premium.",
      price: 15000,
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
      isBestSeller: true,
      hasSauceModifier: false,
    },
  ];

  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.slug);
    if (!categoryId) continue;

    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });

    if (!existing) {
      await prisma.menuItem.create({
        data: {
          categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          isBestSeller: item.isBestSeller,
          hasSauceModifier: item.hasSauceModifier,
          isAvailable: true,
        },
      });
    }
  }

  console.log("✅ Kantin Mini database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
