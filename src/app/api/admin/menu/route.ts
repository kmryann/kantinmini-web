import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    const items = await prisma.menuItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        categories,
        items,
      },
    });
  } catch (error) {
    console.error("Error fetching admin menu:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat katalog menu" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      categoryId,
      imageUrl,
      isAvailable = true,
      isBestSeller = false,
      hasSauceModifier = false,
      modifierName,
      modifierOptions,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama menu wajib diisi" },
        { status: 400 }
      );
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json(
        { success: false, error: "Harga menu harus berupa angka positif" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Kategori wajib dipilih" },
        { status: 400 }
      );
    }

    if (!imageUrl?.trim()) {
      return NextResponse.json(
        { success: false, error: "Foto menu wajib diisi/diunggah" },
        { status: 400 }
      );
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Math.round(Number(price)),
        categoryId,
        imageUrl: imageUrl.trim(),
        isAvailable: Boolean(isAvailable),
        isBestSeller: Boolean(isBestSeller),
        hasSauceModifier: Boolean(hasSauceModifier),
        modifierName: modifierName ? String(modifierName).trim() : null,
        modifierOptions: modifierOptions ? String(modifierOptions).trim() : null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating menu item:", error);
    const message = error instanceof Error ? error.message : "Gagal menambahkan menu baru";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
