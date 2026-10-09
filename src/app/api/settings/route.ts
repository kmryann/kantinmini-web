import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil pengaturan kantin.",
        // Fallback default
        data: {
          id: "default",
          orderMode: "WHATSAPP",
          whatsappNumber: "085117698117",
        },
      },
      { status: 500 }
    );
  }
}
