import React, { Suspense } from "react";
import CartClient from "./CartClient";
import { CartProvider } from "@/context/CartContext";
import { prisma } from "@/lib/prisma";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  let initialSetting: {
    orderMode: "DIRECT" | "WHATSAPP";
    whatsappNumber: string;
  } = {
    orderMode: "WHATSAPP",
    whatsappNumber: "085117693117",
  };

  try {
    const setting = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });
    if (setting) {
      initialSetting = {
        orderMode: (setting.orderMode as "DIRECT" | "WHATSAPP") || "WHATSAPP",
        whatsappNumber: setting.whatsappNumber || "085117693117",
      };
    }
  } catch (err) {
    console.error("Error pre-fetching store setting in CartPage:", err);
  }

  return (
    <CartProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <span className="text-sm font-semibold text-ink-muted">
              Memuat Keranjang...
            </span>
          </div>
        }
      >
        <CartClient storeSetting={initialSetting} />
      </Suspense>
    </CartProvider>
  );
}
