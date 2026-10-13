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

  let initialSetting: {
    orderMode: "DIRECT" | "WHATSAPP";
    whatsappNumber: string;
  } = {
    orderMode: "WHATSAPP",
    whatsappNumber: "085117693117",
  };

  try {
    const rawCategories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    const setting = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });
    if (setting) {
      initialSetting = {
        orderMode: (setting.orderMode as "DIRECT" | "WHATSAPP") || "WHATSAPP",
        whatsappNumber: setting.whatsappNumber || "085117693117",
      };
    }

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
        modifierName: m.modifierName,
        modifierOptions: m.modifierOptions,
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
        <OrderClient
          initialCategories={initialCategories}
          storeSetting={initialSetting}
        />
      </Suspense>
    </CartProvider>
  );
}
