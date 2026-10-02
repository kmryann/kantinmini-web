import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import TransactionsClient from "@/app/admin/transactions/TransactionsClient";

export const metadata = {
  title: "Laporan Transaksi | Manager Kantin Mini",
  description: "Laporan riwayat transaksi, metode pembayaran, dan status pesanan",
};

export const dynamic = "force-dynamic";

export default async function ManagerTransactionsPage() {
  const session = await getAdminSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    redirect("/admin/login");
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    take: 150,
  });

  return (
    <TransactionsClient
      initialOrders={JSON.parse(JSON.stringify(orders))}
      userRole={session.role}
    />
  );
}
