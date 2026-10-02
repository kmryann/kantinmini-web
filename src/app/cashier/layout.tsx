import React from "react";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/app/admin/AdminLayoutClient";
import { getAdminSession } from "@/lib/auth";

export const metadata = {
  title: "Kasir POS | Kantin Mini",
  description: "Point of Sale Kasir Kantin Mini dan Laporan Transaksi",
};

export default async function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session.role === "MANAGER") {
    redirect("/manager");
  }
  return <AdminLayoutClient currentUser={session}>{children}</AdminLayoutClient>;
}
