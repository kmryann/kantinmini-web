import React from "react";
import { prisma } from "@/lib/prisma";
import AdminMenuClient from "./AdminMenuClient";

export const metadata = {
  title: "Manajemen Menu | Admin Kantin Mini",
  description: "Kelola daftar menu, harga, ketersediaan, dan foto menu Kantin Mini",
};

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const items = await prisma.menuItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      category: true,
    },
  });

  return (
    <AdminMenuClient
      initialCategories={JSON.parse(JSON.stringify(categories))}
      initialItems={JSON.parse(JSON.stringify(items))}
    />
  );
}
