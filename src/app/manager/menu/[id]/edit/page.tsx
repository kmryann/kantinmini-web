import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuFormPageClient from "@/app/admin/menu/MenuFormPageClient";

export const metadata = {
  title: "Edit Menu | Manager Kantin Mini",
  description: "Ubah detail menu dan harga untuk katalog Kantin Mini",
};

export const dynamic = "force-dynamic";

export default async function ManagerEditMenuPage({
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
      role="MANAGER"
      backUrl="/manager/menu"
    />
  );
}
