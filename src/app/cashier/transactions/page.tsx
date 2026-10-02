import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import TransactionsClient from "@/app/admin/transactions/TransactionsClient";

export const metadata = {
  title: "Laporan Transaksi Kasir | Kantin Mini",
  description: "Riwayat transaksi kasir, detail struk, dan status pembayaran",
};

export const dynamic = "force-dynamic";

export default async function CashierTransactionsPage() {
  const session = await getAdminSession();
  if (!session) {
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
    take: 100,
  });

  return (
    <TransactionsClient
      initialOrders={JSON.parse(JSON.stringify(orders))}
      userRole={session.role}
    />
  );
}
