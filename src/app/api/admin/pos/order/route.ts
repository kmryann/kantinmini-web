import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sseBroadcaster } from "@/lib/sse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tableNumber,
      customerName,
      orderType,
      paymentMethod,
      items,
      isPaidNow,
      cashReceived,
    } = body;

    if (!customerName?.trim() || !items || !items.length) {
      return NextResponse.json(
        { success: false, error: "Nama pelanggan dan item pesanan wajib diisi." },
        { status: 400 }
      );
    }

    // Default table is Meja 1 if not specified (e.g. for Takeaway)
    const targetTableNum = Number(tableNumber) || 1;
    let table = await prisma.diningTable.findUnique({
      where: { tableNumber: targetTableNum },
    });

    if (!table) {
      // Auto-create table if doesn't exist
      table = await prisma.diningTable.create({
        data: {
          tableNumber: targetTableNum,
          status: "AVAILABLE",
        },
      });
    }

    // Fetch and validate items
    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const itemMap = new Map(dbMenuItems.map((it) => [it.id, it]));
    let subtotal = 0;

    const validatedItems = items.map(
      (it: {
        menuItemId: string;
        quantity: number;
        sauceOption?: string;
        notes?: string;
      }) => {
        const dbItem = itemMap.get(it.menuItemId);
        if (!dbItem) throw new Error("Item menu tidak ditemukan.");
        const qty = Math.max(1, Number(it.quantity) || 1);
        subtotal += dbItem.price * qty;

        return {
          menuItemId: it.menuItemId,
          quantity: qty,
          price: dbItem.price,
          sauceOption: it.sauceOption || null,
          notes: it.notes?.trim() || null,
        };
      }
    );

    const totalAmount = subtotal;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `POS-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const isPaid = isPaidNow !== false; // Default true for POS
    const status = isPaid ? "PROSES" : "PENDING_PAYMENT";
    const paymentStatus = isPaid ? "PAID" : "PENDING";

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          tableId: table.id,
          customerName: customerName.trim(),
          orderType: orderType === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN",
          status,
          paymentMethod: paymentMethod === "QRIS" ? "QRIS" : "CASH",
          paymentStatus,
          subtotal,
          discountAmount: 0,
          totalAmount,
          items: {
            create: validatedItems,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          table: true,
        },
      });

      if (orderType === "DINE_IN") {
        await tx.diningTable.update({
          where: { id: table.id },
          data: { status: "PROSES" },
        });
      }

      return created;
    });

    // Broadcast SSE to kitchen and monitors
    sseBroadcaster.broadcast(order.id, {
      type: "ORDER_CREATED",
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      order,
      cashChange:
        cashReceived && Number(cashReceived) >= totalAmount
          ? Number(cashReceived) - totalAmount
          : 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
