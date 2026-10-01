import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sseBroadcaster } from "@/lib/sse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableNumber, customerName, orderType, paymentMethod, items } = body;

    if (!tableNumber || !customerName?.trim() || !items || !items.length) {
      return NextResponse.json(
        { success: false, error: "Mohon lengkapi nama pelanggan dan pilihan menu." },
        { status: 400 }
      );
    }

    const table = await prisma.diningTable.findUnique({
      where: { tableNumber: Number(tableNumber) },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: `Meja ${tableNumber} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Verify item prices from DB for security
    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    const menuItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    let calculatedSubtotal = 0;
    const validatedItems = items.map(
      (item: {
        menuItemId: string;
        quantity: number;
        sauceOption?: string;
        notes?: string;
      }) => {
        const dbItem = menuItemMap.get(item.menuItemId);
        if (!dbItem) {
          throw new Error(`Item menu tidak valid.`);
        }
        if (!dbItem.isAvailable) {
          throw new Error(`Menu "${dbItem.name}" sedang habis (Sold Out).`);
        }
        const qty = Math.max(1, Number(item.quantity) || 1);
        const itemPrice = dbItem.price;
        calculatedSubtotal += itemPrice * qty;

        return {
          menuItemId: item.menuItemId,
          quantity: qty,
          price: itemPrice,
          sauceOption: item.sauceOption || null,
          notes: item.notes?.trim() || null,
        };
      }
    );

    const discountAmount = 0; // Diskon hanya bisa diinput oleh Manager di POS
    const totalAmount = calculatedSubtotal - discountAmount;

    // Generate Order Number
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `KM-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Menit

    const isQRIS = paymentMethod === "QRIS";
    const qrisPayload = isQRIS
      ? `00020101021226670016ID.KANTINMINI.WWW01189360091100223456780215${orderNumber}520458125303360540${totalAmount}5802ID5911KANTIN MINI6007BANDUNG6304`
      : null;

    const cashCode = !isQRIS ? `#${orderNumber}` : null;

    // Run transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          tableId: table.id,
          customerName: customerName.trim(),
          orderType: orderType === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN",
          status: "PENDING_PAYMENT",
          paymentMethod: isQRIS ? "QRIS" : "CASH",
          paymentStatus: "PENDING",
          subtotal: calculatedSubtotal,
          discountAmount,
          totalAmount,
          qrisPayload,
          qrisExpiresAt: isQRIS ? expiresAt : null,
          cashCode,
          cashExpiresAt: !isQRIS ? expiresAt : null,
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

      // If CASH, update table status to CASH_PENDING if currently AVAILABLE
      if (!isQRIS && table.status === "AVAILABLE") {
        await tx.diningTable.update({
          where: { id: table.id },
          data: { status: "CASH_PENDING" },
        });
      }

      return order;
    });

    // Broadcast SSE to POS / Cashier
    sseBroadcaster.broadcast("ORDER_CREATED", {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      tableNumber: table.tableNumber,
      customerName: newOrder.customerName,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan sistem";
    console.error("Error creating order:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
