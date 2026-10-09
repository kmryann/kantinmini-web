import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuFormPageClient from "../../MenuFormPageClient";

export const metadata = {
  title: "Edit Menu | Admin Kantin Mini",
  description: "Ubah detail menu dan harga untuk katalog Kantin Mini",
};

export const dynamic = "force-dynamic";

export default async function AdminEditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!item) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <MenuFormPageClient
      categories={JSON.parse(JSON.stringify(categories))}
      initialItem={JSON.parse(JSON.stringify(item))}
      role="ADMIN"
      backUrl="/admin/menu"
    />
  );
}
