import React from "react";
import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "@/app/admin/AdminDashboardClient";

export const metadata = {
  title: "Dashboard | Manager Kantin Mini",
  description: "Laporan keuangan, omzet, dan metrik operasional Kantin Mini",
};

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const [
    totalMenuItems,
    availableMenuItems,
    totalCategories,
    recentOrders,
    allOrders,
  ] = await Promise.all([
    prisma.menuItem.count(),
    prisma.menuItem.count({ where: { isAvailable: true } }),
    prisma.category.count(),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        totalAmount: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculations
  const paidOrders = allOrders.filter(
    (o) => o.paymentStatus === "PAID" || o.status === "SELESAI"
  );
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingPaymentOrders = allOrders.filter(
    (o) => o.paymentStatus === "PENDING" && o.status !== "VOID"
  ).length;

  const inCookingOrders = allOrders.filter((o) => o.status === "PROSES").length;
  const readyOrders = allOrders.filter((o) => o.status === "DIHIDANGKAN").length;
  const completedOrders = allOrders.filter((o) => o.status === "SELESAI").length;

  const dashboardData = {
    stats: {
      totalRevenue,
      totalOrders: allOrders.length,
      paidOrdersCount: paidOrders.length,
      totalMenuItems,
      availableMenuItems,
      totalCategories,
      pendingPaymentOrders,
      inCookingOrders,
      readyOrders,
      completedOrders,
    },
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  };

  return <AdminDashboardClient data={dashboardData} basePath="/manager" />;
}
