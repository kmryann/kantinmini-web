import React from "react";
import { Loader2 } from "lucide-react";

export default function ManagerLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-6 animate-in fade-in duration-150">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <span className="text-xs font-bold text-ink-muted tracking-wide">
          Memuat data manager...
        </span>
      </div>
    </div>
  );
}
