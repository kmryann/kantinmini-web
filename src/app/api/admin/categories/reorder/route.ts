import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { items } = body as { items: Array<{ id: string; sortOrder: number }> };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Daftar urutan kategori tidak valid." },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Urutan kategori berhasil diperbarui." });
  } catch (error) {
    console.error("Reorder categories error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui urutan kategori." },
      { status: 500 }
    );
  }
}
