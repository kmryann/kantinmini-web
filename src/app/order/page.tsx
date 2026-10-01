import React, { Suspense } from "react";
import OrderClient from "./OrderClient";
import { CartProvider } from "@/context/CartContext";
import { prisma } from "@/lib/prisma";
import { Loader2 } from "lucide-react";
import { CategoryWithItems } from "@/types";

// Force dynamic rendering so menu updates appear instantly
export const dynamic = "force-dynamic";

export default async function OrderPage() {
  let initialCategories: CategoryWithItems[] = [];

  try {
    const rawCategories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    initialCategories = rawCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      menuItems: c.menuItems.map((m) => ({
        id: m.id,
        categoryId: m.categoryId,
        name: m.name,
        description: m.description,
        price: m.price,
        imageUrl: m.imageUrl,
        isAvailable: m.isAvailable,
        isBestSeller: m.isBestSeller,
        hasSauceModifier: m.hasSauceModifier,
      })),
    }));
  } catch (err) {
    console.error("Error pre-fetching menu categories on server:", err);
  }

  return (
    <CartProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <span className="text-sm font-semibold text-ink-muted">
              Memuat Menu Meja...
            </span>
          </div>
        }
      >
        <OrderClient initialCategories={initialCategories} />
      </Suspense>
    </CartProvider>
  );
}
