import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sseBroadcaster } from "@/lib/sse";

// GET /api/admin/orders - Ambil daftar pesanan aktif & filter status
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !["ADMIN", "MANAGER", "CASHIER"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Akses tidak diizinkan." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "active"; // active, all, pending_payment, proses, dihidangkan, selesai, void
    const query = searchParams.get("query")?.trim() || "";

    const where: any = {};

    if (filter === "active") {
      // Pesanan yang masih berjalan (belum selesai / void)
      where.status = { in: ["PENDING_PAYMENT", "PROSES", "DIHIDANGKAN"] };
    } else if (filter === "pending_payment") {
      where.paymentStatus = "PENDING";
      where.status = { not: "VOID" };
    } else if (filter === "proses") {
      where.status = "PROSES";
    } else if (filter === "dihidangkan") {
      where.status = "DIHIDANGKAN";
    } else if (filter === "selesai") {
      where.status = "SELESAI";
    } else if (filter === "void") {
      where.status = "VOID";
    }

    if (query) {
      where.OR = [
        { customerName: { contains: query } },
        { orderNumber: { contains: query } },
        { cashCode: { contains: query } },
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
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat daftar pesanan." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders - Update status pesanan / pembayaran
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !["ADMIN", "MANAGER", "CASHIER"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Akses tidak diizinkan." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, action, voidReason } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: "Parameter orderId dan action wajib disertakan." },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      let updateData: any = {};
      let tableStatusUpdate: string | null = null;

      if (action === "CONFIRM_PAYMENT") {
        // Kasir konfirmasi pembayaran tunai/qris manual
        updateData = {
          paymentStatus: "PAID",
          status: existingOrder.status === "PENDING_PAYMENT" ? "PROSES" : existingOrder.status,
        };
        tableStatusUpdate = "PROSES";
      } else if (action === "SET_PROSES") {
        // Validasi PayFirst: Pesanan QRIS yang belum dibayar tidak boleh dimasak
        if (existingOrder.paymentMethod === "QRIS" && existingOrder.paymentStatus !== "PAID") {
          throw new Error("Pesanan QRIS wajib dibayar (Lunas) terlebih dahulu sebelum dimasak.");
        }
        updateData = { status: "PROSES" };
        tableStatusUpdate = "PROSES";
      } else if (action === "SET_DIHIDANGKAN") {
        updateData = { status: "DIHIDANGKAN" };
        tableStatusUpdate = "DIHIDANGKAN";
      } else if (action === "SET_SELESAI") {
        updateData = {
          status: "SELESAI",
          // Jika sudah selesai, pastikan pembayaran juga PAID jika belum
          paymentStatus: existingOrder.paymentStatus === "PENDING" ? "PAID" : existingOrder.paymentStatus,
        };
        tableStatusUpdate = "AVAILABLE";
      } else if (action === "SET_VOID") {
        if (!voidReason?.trim()) {
          throw new Error("Alasan pembatalan (void) wajib diisi.");
        }
        updateData = {
          status: "VOID",
          paymentStatus: existingOrder.paymentStatus === "PAID" ? "CANCELLED" : "CANCELLED",
          voidReason: voidReason.trim(),
        };
        tableStatusUpdate = "AVAILABLE";

        // Buat audit log jika di-void
        await tx.auditLog.create({
          data: {
            action: "VOID_ORDER",
            performedByUserId: session.userId,
            details: `Void pesanan #${existingOrder.orderNumber}: ${voidReason.trim()}`,
          },
        });
      } else {
        throw new Error("Aksi update tidak dikenali.");
      }

      const resOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          table: true,
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      if (tableStatusUpdate && existingOrder.tableId) {
        await tx.diningTable.update({
          where: { id: existingOrder.tableId },
          data: { status: tableStatusUpdate },
        });
      }

      return resOrder;
    });

    // Broadcast SSE update ke pelanggan dan kasir
    if (action === "CONFIRM_PAYMENT") {
      sseBroadcaster.broadcast("ORDER_PAID", {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        tableNumber: updated.table?.tableNumber,
      });
    }

    sseBroadcaster.broadcast("ORDER_STATUS_CHANGED", {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      tableNumber: updated.table?.tableNumber,
    });

    return NextResponse.json({
      success: true,
      message: "Status pesanan berhasil diperbarui.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui status pesanan." },
      { status: 500 }
    );
  }
}
