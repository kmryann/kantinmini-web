import React from "react";
import { Loader2 } from "lucide-react";
import { LogoKantinMini } from "@/components/common/LogoKantinMini";

export default function OrderLoading() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center p-2.5 text-brand shadow-xs">
          <LogoKantinMini className="w-full h-full text-brand" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand" />
          <span className="text-xs font-extrabold text-ink tracking-tight">
            Menyiapkan Menu Kantin Mini...
          </span>
        </div>
      </div>
    </div>
  );
}
