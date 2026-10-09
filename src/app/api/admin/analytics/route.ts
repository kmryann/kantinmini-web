import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today"; // today, yesterday, 7d, 30d, all
    const chartRange = searchParams.get("chartRange") || "7d"; // 7d, 30d
    const trendingRange = searchParams.get("trendingRange") || range; // today, yesterday, 7d, 30d, all

    const now = new Date();

    const getDateFilter = (r: string) => {
      if (r === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { gte: startOfToday };
      } else if (r === "yesterday") {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { gte: startOfYesterday, lt: endOfYesterday };
      } else if (r === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return { gte: sevenDaysAgo };
      } else if (r === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return { gte: thirtyDaysAgo };
      }
      return undefined;
    };

    // 1. Hitung filter tanggal untuk Ringkasan Utama (Cards)
    const summaryDateFilter = getDateFilter(range);

    // Ambil orders untuk ringkasan berdasarkan range terpilih
    const summaryOrders = await prisma.order.findMany({
      where: summaryDateFilter ? { createdAt: summaryDateFilter } : undefined,
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        orderType: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Perhitungan Ringkasan Utama (Cards)
    const totalOrders = summaryOrders.length;
    const paidOrders = summaryOrders.filter(
      (o) => o.paymentStatus === "PAID" && o.status !== "VOID"
    );
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Breakdown Tipe Pesanan: Dine In vs Takeaway
    const dineInOrders = summaryOrders.filter((o) => o.orderType === "DINE_IN");
    const takeawayOrders = summaryOrders.filter((o) => o.orderType === "TAKEAWAY");
    const dineInCount = dineInOrders.length;
    const takeawayCount = takeawayOrders.length;

    // Breakdown Metode Pembayaran
    const cashOrders = paidOrders.filter((o) => o.paymentMethod === "CASH");
    const qrisOrders = paidOrders.filter((o) => o.paymentMethod === "QRIS");
    const cashCount = cashOrders.length;
    const qrisCount = qrisOrders.length;
    const cashRevenue = cashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const qrisRevenue = qrisOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Trending Menus (Bisa punya filter tanggal tersendiri)
    const trendingDateFilter = getDateFilter(trendingRange);
    const trendingOrders = await prisma.order.findMany({
      where: {
        ...(trendingDateFilter ? { createdAt: trendingDateFilter } : {}),
        paymentStatus: "PAID",
        status: { not: "VOID" },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    const itemSalesMap = new Map<
      string,
      { id: string; name: string; quantity: number; revenue: number; imageUrl: string }
    >();

    for (const order of trendingOrders) {
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

    // 2. Data Grafik Income & Grafik Total Order (Bisa 7 Hari atau 30 Hari Terakhir)
    const daysCount = chartRange === "30d" ? 30 : 7;
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

    // Inisialisasi slot data harian
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
        month: daysCount > 10 ? "numeric" : "short",
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

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          range,
          totalRevenue,
          totalOrders,
          paidOrdersCount: paidOrders.length,
          dineInCount,
          takeawayCount,
          cashCount,
          qrisCount,
          cashRevenue,
          qrisRevenue,
        },
        trendingMenus,
        charts: {
          chartRange,
          dailyData: dailyChartData,
        },
      },
    });
  } catch (error) {
    console.error("Manager analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat analisis data manager." },
      { status: 500 }
    );
  }
}
