import React, { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Login Admin | Kantin Mini",
  description: "Masuk ke panel pengelolaan menu, pesanan, dan POS Kantin Mini",
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
