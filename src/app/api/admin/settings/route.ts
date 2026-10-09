import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let setting = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.storeSetting.create({
        data: {
          id: "default",
          orderMode: "WHATSAPP",
          whatsappNumber: "085117698117",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: setting.id,
        orderMode: setting.orderMode,
        whatsappNumber: setting.whatsappNumber,
        updatedAt: setting.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil pengaturan kantin." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin/Manager yang berhak mengubah pengaturan." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderMode, whatsappNumber } = body;

    if (orderMode && !["DIRECT", "WHATSAPP"].includes(orderMode)) {
      return NextResponse.json(
        { success: false, error: "Mode pemesanan tidak valid. Pilih DIRECT atau WHATSAPP." },
        { status: 400 }
      );
    }

    let cleanWa = whatsappNumber ? String(whatsappNumber).trim() : undefined;
    if (cleanWa) {
      // Hilangkan karakter selain angka
      cleanWa = cleanWa.replace(/[^0-9]/g, "");
      if (cleanWa.startsWith("62")) {
        // ok
      } else if (cleanWa.startsWith("0")) {
        // format 08...
      } else {
        cleanWa = `0${cleanWa}`;
      }
    }

    const updated = await prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {
        ...(orderMode ? { orderMode } : {}),
        ...(cleanWa ? { whatsappNumber: cleanWa } : {}),
      },
      create: {
        id: "default",
        orderMode: orderMode || "WHATSAPP",
        whatsappNumber: cleanWa || "085117698117",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengaturan berhasil diperbarui.",
      data: {
        id: updated.id,
        orderMode: updated.orderMode,
        whatsappNumber: updated.whatsappNumber,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan pengaturan kantin." },
      { status: 500 }
    );
  }
}
