import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import CashierClient from "./CashierClient";

export const metadata = {
  title: "Kasir POS & Transaksi | Kantin Mini",
  description: "Point of Sale Kasir Kantin Mini untuk input order dan laporan transaksi kasir",
};

export const dynamic = "force-dynamic";

export default async function CashierPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // Jika manager membuka kasir, arahkan ke /admin (sesuai aturan: POS hanya di kasir)
  if (session.role === "MANAGER") {
    redirect("/admin");
  }

  const [categories, items, tables, recentOrders] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: true,
      },
    }),
    prisma.diningTable.findMany({
      orderBy: { tableNumber: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    }),
  ]);

  return (
    <CashierClient
      categories={JSON.parse(JSON.stringify(categories))}
      items={JSON.parse(JSON.stringify(items))}
      tables={JSON.parse(JSON.stringify(tables))}
      initialOrders={JSON.parse(JSON.stringify(recentOrders))}
      currentUser={session}
    />
  );
}
