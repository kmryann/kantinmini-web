import React, { Suspense } from "react";
import CartClient from "./CartClient";
import { CartProvider } from "@/context/CartContext";
import { Loader2 } from "lucide-react";

export default function CartPage() {
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
        <CartClient />
      </Suspense>
    </CartProvider>
  );
}
