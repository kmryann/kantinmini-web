import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.table.tableNumber,
        customerName: order.customerName,
        orderType: order.orderType,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        qrisPayload: order.qrisPayload,
        qrisExpiresAt: order.qrisExpiresAt?.toISOString() || null,
        cashCode: order.cashCode,
        cashExpiresAt: order.cashExpiresAt?.toISOString() || null,
        voidReason: order.voidReason,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({
          id: i.id,
          name: i.menuItem.name,
          price: i.price,
          quantity: i.quantity,
          sauceOption: i.sauceOption,
          notes: i.notes,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat status pesanan" },
      { status: 500 }
    );
  }
}
