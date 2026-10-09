import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import CashierOrdersClient from "./CashierOrdersClient";

export const metadata = {
  title: "Pesanan Masuk & Antrean Kasir | Kantin Mini",
  description: "Kelola pesanan masuk dari meja pelanggan, konfirmasi pembayaran, dan perbarui status dapur.",
};

export const dynamic = "force-dynamic";

export default async function CashierOrdersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  // Ambil pesanan aktif (PENDING_PAYMENT, PROSES, DIHIDANGKAN)
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ["PENDING_PAYMENT", "PROSES", "DIHIDANGKAN"],
      },
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
    take: 50,
  });

  return (
    <CashierOrdersClient
      initialOrders={JSON.parse(JSON.stringify(orders))}
      userRole={session.role}
    />
  );
}
