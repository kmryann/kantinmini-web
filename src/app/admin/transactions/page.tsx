import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import TransactionsClient from "./TransactionsClient";

export const metadata = {
  title: "Laporan Transaksi | Admin Kantin Mini",
  description: "Laporan riwayat transaksi, metode pembayaran, dan status pesanan",
};

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const session = await getAdminSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    redirect("/admin");
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay },
    },
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    take: 200,
  });

  return (
    <TransactionsClient
      initialOrders={JSON.parse(JSON.stringify(orders))}
      userRole={session.role}
    />
  );
}
