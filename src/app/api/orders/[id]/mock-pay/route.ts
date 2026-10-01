import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sseBroadcaster } from "@/lib/sse";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Pesanan sudah berstatus lunas.",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          paymentStatus: "PAID",
          status: "PROSES",
        },
      });

      // Update table to PROSES
      await tx.diningTable.update({
        where: { id: order.tableId },
        data: { status: "PROSES" },
      });

      return updatedOrder;
    });

    // Broadcast SSE
    sseBroadcaster.broadcast("ORDER_PAID", {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: "PROSES",
      tableNumber: order.table.tableNumber,
    });

    return NextResponse.json({
      success: true,
      message: "Simulasi pembayaran QRIS berhasil! Pesanan diproses ke dapur.",
      data: updated,
    });
  } catch (error) {
    console.error("Error mock paying order:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses simulasi pembayaran" },
      { status: 500 }
    );
  }
}
