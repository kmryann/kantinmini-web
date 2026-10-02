import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Menu tidak ditemukan" },
        { status: 404 }
      );
    }

    const {
      name,
      description,
      price,
      categoryId,
      imageUrl,
      isAvailable,
      isBestSeller,
      hasSauceModifier,
      modifierName,
      modifierOptions,
    } = body;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price: Math.round(Number(price)) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl.trim() }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(isBestSeller !== undefined && { isBestSeller: Boolean(isBestSeller) }),
        ...(hasSauceModifier !== undefined && { hasSauceModifier: Boolean(hasSauceModifier) }),
        ...(modifierName !== undefined && {
          modifierName: modifierName ? String(modifierName).trim() : null,
        }),
        ...(modifierOptions !== undefined && {
          modifierOptions: modifierOptions ? String(modifierOptions).trim() : null,
        }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("Error updating menu item:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui menu";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Menu tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Menu berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus menu" },
      { status: 500 }
    );
  }
}
