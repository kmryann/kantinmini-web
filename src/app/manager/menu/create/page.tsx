import React from "react";
import { prisma } from "@/lib/prisma";
import MenuFormPageClient from "@/app/admin/menu/MenuFormPageClient";

export const metadata = {
  title: "Tambah Menu Baru | Manager Kantin Mini",
  description: "Formulir penambahan menu baru untuk katalog Kantin Mini",
};

export const dynamic = "force-dynamic";

export default async function ManagerCreateMenuPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <MenuFormPageClient
      categories={JSON.parse(JSON.stringify(categories))}
      role="MANAGER"
      backUrl="/manager/menu"
    />
  );
}
