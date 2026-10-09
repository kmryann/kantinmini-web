import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET /api/admin/transactions - Mengambil laporan & riwayat transaksi lengkap
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    // Diperbolehkan untuk ADMIN, MANAGER, dan CASHIER
    if (!session || !["ADMIN", "MANAGER", "CASHIER"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak sah." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";
    const status = searchParams.get("status") || "all";
    const paymentMethod = searchParams.get("paymentMethod") || "all";
    const query = searchParams.get("query")?.trim() || "";

    // Tentukan filter tanggal
    let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined;
    const now = new Date();

    if (range === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfDay };
    } else if (range === "yesterday") {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
      dateFilter = { gte: startOfYesterday, lte: endOfYesterday };
    } else if (range === "7d") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      dateFilter = { gte: sevenDaysAgo };
    } else if (range === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      dateFilter = { gte: thirtyDaysAgo };
    }

    // Bangun klausa where
    const where: {
      createdAt?: { gte?: Date; lte?: Date };
      status?: string;
      paymentMethod?: string;
      OR?: Array<{
        customerName?: { contains: string };
        orderNumber?: { contains: string };
      }>;
    } = {};

    if (dateFilter) {
      where.createdAt = dateFilter;
    }
    if (status !== "all") {
      where.status = status;
    }
    if (paymentMethod !== "all") {
      where.paymentMethod = paymentMethod;
    }
    if (query) {
      where.OR = [
        { customerName: { contains: query } },
        { orderNumber: { contains: query } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      take: 200, // Batasi untuk efisiensi
    });

    // Hitung ringkasan statistik
    const totalTransactions = orders.length;
    const successfulOrders = orders.filter(
      (o) => o.paymentStatus === "PAID" && o.status !== "VOID"
    );
    const totalRevenue = successfulOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const cashCount = successfulOrders.filter((o) => o.paymentMethod === "CASH").length;
    const qrisCount = successfulOrders.filter((o) => o.paymentMethod === "QRIS").length;

    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats: {
          totalTransactions,
          totalRevenue,
          cashCount,
          qrisCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat riwayat transaksi." },
      { status: 500 }
    );
  }
}
