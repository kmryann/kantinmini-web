import React from "react";
import { prisma } from "@/lib/prisma";
import AdminMenuClient from "@/app/admin/menu/AdminMenuClient";

export const metadata = {
  title: "Ubah Menu | Manager Kantin Mini",
  description: "Kelola ketersediaan menu, harga, dan produk Kantin Mini",
};

export const dynamic = "force-dynamic";

export default async function ManagerMenuPage() {
  const [categories, items] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
      },
    }),
  ]);

  return (
    <AdminMenuClient
      initialCategories={JSON.parse(JSON.stringify(categories))}
      initialItems={JSON.parse(JSON.stringify(items))}
    />
  );
}
