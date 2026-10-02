import React from "react";
import AdminLayoutClient from "./AdminLayoutClient";
import { getAdminSession } from "@/lib/auth";

export const metadata = {
  title: "Admin Panel | Kantin Mini",
  description: "Dashboard dan Panel Manajemen Kantin Mini",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  return <AdminLayoutClient currentUser={session}>{children}</AdminLayoutClient>;
}

