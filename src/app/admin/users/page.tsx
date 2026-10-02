import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import UsersClient from "./UsersClient";

export const metadata = {
  title: "Kelola Akun & Role | Admin Kantin Mini",
  description: "Buat dan kelola akun pengguna dengan role Admin, Manager, dan Kasir",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      pinHash: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "desc" },
    ],
  });

  const formattedUsers = users.map((u) => ({
    ...u,
    hasPin: Boolean(u.pinHash),
    pinHash: undefined,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <UsersClient
      initialUsers={formattedUsers}
      currentUserId={session.userId}
    />
  );
}
