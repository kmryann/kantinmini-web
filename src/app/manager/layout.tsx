import React from "react";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/app/admin/AdminLayoutClient";
import { getAdminSession } from "@/lib/auth";

export const metadata = {
  title: "Manager Panel | Kantin Mini",
  description: "Dashboard Operasional & Laporan Keuangan Manager Kantin Mini",
};

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session.role === "CASHIER") {
    redirect("/cashier");
  }
  return <AdminLayoutClient currentUser={session}>{children}</AdminLayoutClient>;
}
