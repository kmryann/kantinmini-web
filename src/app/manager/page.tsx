import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import ManagerDashboardClient from "./ManagerDashboardClient";

export const metadata = {
  title: "Dashboard Manager | Kantin Mini",
  description: "Laporan pendapatan, grafik penjualan, menu terlaris, dan tipe pesanan",
};

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  // Jika bukan Manager / Admin, arahkan
  if (session.role === "CASHIER") {
    redirect("/cashier");
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Ambil data pesanan hari ini (default summary filter)
  const todayOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfToday },
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = todayOrders.length;
  const paidOrders = todayOrders.filter(
    (o) => o.paymentStatus === "PAID" && o.status !== "VOID"
  );
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Dine In vs Takeaway
  const dineInCount = todayOrders.filter((o) => o.orderType === "DINE_IN").length;
  const takeawayCount = todayOrders.filter((o) => o.orderType === "TAKEAWAY").length;

  // Cash vs QRIS
  const cashCount = paidOrders.filter((o) => o.paymentMethod === "CASH").length;
  const qrisCount = paidOrders.filter((o) => o.paymentMethod === "QRIS").length;

  // Trending Menus (Hari ini)
  const itemSalesMap = new Map<
    string,
    { id: string; name: string; quantity: number; revenue: number; imageUrl: string }
  >();

  for (const order of paidOrders) {
    for (const item of order.items) {
      const existing = itemSalesMap.get(item.menuItemId) || {
        id: item.menuItemId,
        name: item.menuItem.name,
        quantity: 0,
        revenue: 0,
        imageUrl: item.menuItem.imageUrl || "",
      };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      itemSalesMap.set(item.menuItemId, existing);
    }
  }

  const trendingMenus = Array.from(itemSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  // 2. Data grafik 7 hari terakhir (default chart)
  const daysCount = 7;
  const chartStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysCount - 1));

  const chartOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: chartStartDate },
    },
    select: {
      id: true,
      totalAmount: true,
      paymentStatus: true,
      status: true,
      orderType: true,
      createdAt: true,
    },
  });

  const dailyChartData: Array<{
    date: string;
    label: string;
    revenue: number;
    orderCount: number;
    dineInCount: number;
    takeawayCount: number;
  }> = [];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(chartStartDate);
    d.setDate(chartStartDate.getDate() + i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    dailyChartData.push({
      date: dateKey,
      label,
      revenue: 0,
      orderCount: 0,
      dineInCount: 0,
      takeawayCount: 0,
    });
  }

  const chartMap = new Map(dailyChartData.map((d) => [d.date, d]));

  for (const order of chartOrders) {
    const d = new Date(order.createdAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = chartMap.get(dateKey);
    if (entry) {
      entry.orderCount += 1;
      if (order.orderType === "DINE_IN") {
        entry.dineInCount += 1;
      } else {
        entry.takeawayCount += 1;
      }

      if (order.paymentStatus === "PAID" && order.status !== "VOID") {
        entry.revenue += order.totalAmount;
      }
    }
  }

  const initialData = {
    summary: {
      range: "today",
      totalRevenue,
      totalOrders,
      paidOrdersCount: paidOrders.length,
      dineInCount,
      takeawayCount,
      cashCount,
      qrisCount,
    },
    trendingMenus,
    charts: {
      chartRange: "7d",
      dailyData: dailyChartData,
    },
  };

  return <ManagerDashboardClient initialData={JSON.parse(JSON.stringify(initialData))} />;
}
