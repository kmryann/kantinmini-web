"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  MonitorCheck,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { StoreSettingType } from "@/types";

interface SettingsClientProps {
  initialSetting: StoreSettingType;
  role: "ADMIN" | "MANAGER";
}

export default function SettingsClient({
  initialSetting,
  role,
}: SettingsClientProps) {
  const [orderMode, setOrderMode] = useState<"DIRECT" | "WHATSAPP">(
    initialSetting.orderMode
  );
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    initialSetting.whatsappNumber || "085117698117"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderMode,
          whatsappNumber: whatsappNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan pengaturan.");
      }

      setFeedback({
        type: "success",
        message: "Pengaturan operasional berhasil disimpan!",
      });

      // Hilangkan notifikasi sukses setelah 4 detik
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-ink tracking-tight">
          Pengaturan Toko & Pemesanan
        </h1>
        <p className="text-xs md:text-sm text-ink-muted mt-1">
          Atur bagaimana pelanggan memesan menu Anda (Direct POS / Kasir atau Order via WhatsApp).
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
              : "bg-rose-50/80 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span className="text-xs md:text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card Mode Pemesanan */}
        <div className="bg-surface rounded-2xl p-5 md:p-6 border border-surface-border shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-ink">
                Mode Alur Pemesanan
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Pilih mekanisme pemesanan yang aktif pada halaman pelanggan.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand/10 text-brand">
              Mode Aktif: {orderMode === "WHATSAPP" ? "WhatsApp" : "Direct POS"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opsi 1: WhatsApp Mode */}
            <div
              onClick={() => setOrderMode("WHATSAPP")}
              className={`cursor-pointer rounded-2xl p-4 md:p-5 border-2 transition-all relative flex flex-col justify-between ${
                orderMode === "WHATSAPP"
                  ? "border-[#25D366] bg-emerald-50/30 shadow-md ring-2 ring-[#25D366]/20"
                  : "border-surface-border bg-white hover:border-gray-300"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      orderMode === "WHATSAPP"
                        ? "border-[#25D366] bg-[#25D366] text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {orderMode === "WHATSAPP" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-ink flex items-center gap-2">
                    Katalog Menu & Redirect WhatsApp
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25D366]/20 text-emerald-800">
                      Aktif Saat Ini
                    </span>
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Cocok untuk tahap sekarang ketika belum ada tablet/kasir di tempat. Pelanggan bebas memilih menu, varian, dan catatan, lalu saat checkout langsung dialihkan ke chat WhatsApp dengan pesan pesanan rapi.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-ink-muted space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Nomor meja disembunyikan otomatis</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Tidak membebani kasir POS fisik</span>
                </div>
              </div>
            </div>

            {/* Opsi 2: Direct Mode */}
            <div
              onClick={() => setOrderMode("DIRECT")}
              className={`cursor-pointer rounded-2xl p-4 md:p-5 border-2 transition-all relative flex flex-col justify-between ${
                orderMode === "DIRECT"
                  ? "border-brand bg-brand/5 shadow-md ring-2 ring-brand/20"
                  : "border-surface-border bg-white hover:border-gray-300"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs">
                    <MonitorCheck className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      orderMode === "DIRECT"
                        ? "border-brand bg-brand text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {orderMode === "DIRECT" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-ink">
                    Direct Order (POS Kasir & QRIS)
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Pesanan langsung masuk ke sistem database, tercatat di dashboard Kasir & Kitchen, QRIS dinamis otomatis terverifikasi, dan nomor meja pelanggan wajib terisi.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-ink-muted space-y-1">
                <div className="flex items-center gap-1.5 text-brand font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Sempurna untuk demo & portofolio lengkap</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Terintegrasi antrean & cetak struk</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Nomor WhatsApp */}
        <div className="bg-surface rounded-2xl p-5 md:p-6 border border-surface-border shadow-xs space-y-4">
          <div className="pb-3 border-b border-surface-border">
            <h2 className="text-sm md:text-base font-extrabold text-ink">
              Kontak WhatsApp Kantin
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Nomor WhatsApp tujuan yang menerima pesan pesanan dari pelanggan.
            </p>
          </div>

          <div className="space-y-1.5 max-w-md">
            <label
              htmlFor="waInput"
              className="block text-xs md:text-sm font-bold text-ink"
            >
              Nomor WhatsApp (Aktif)
            </label>
            <div className="relative rounded-xl bg-white border border-surface-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 shadow-xs">
              <div className="flex items-center px-3.5 py-2.5 gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <input
                  id="waInput"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="085117698117"
                  className="w-full bg-transparent text-sm md:text-base text-ink placeholder:text-ink-muted/50 focus:outline-hidden font-mono font-semibold"
                />
              </div>
            </div>
            <p className="text-[11px] text-ink-muted">
              Contoh: <span className="font-mono text-ink">085117698117</span> atau{" "}
              <span className="font-mono text-ink">6285117698117</span>. Sistem akan otomatis memformat nomor saat membuka WhatsApp.
            </p>
          </div>
        </div>

        {/* Banner Info Fleksibilitas Portofolio */}
        <div className="rounded-2xl p-4 bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Tips Portofolio & Operasional:</span> Anda dapat beralih mode kapan saja di halaman ini. Saat memamerkan portofolio ke klien atau perekrut, aktifkan <b>Direct Order</b> untuk mendemokan live order & kasir. Saat kantin offline Anda buka hari ini, aktifkan <b>Katalog WhatsApp</b> agar pesanan pelanggan masuk ke WhatsApp pemilik.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-press px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
