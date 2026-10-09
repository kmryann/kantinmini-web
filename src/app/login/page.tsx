import React, { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Masuk Akun | Kantin Mini",
  description: "Masuk ke portal operasional kasir, manajer, dan administrasi Kantin Mini",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-brand/20 border-t-brand rounded-full animate-spin" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
