"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { LogoKantinMini } from "@/components/common/LogoKantinMini";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>("admin");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage("Silakan masukkan username dan kata sandi Anda.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Gagal masuk. Periksa kembali username dan kata sandi.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      // Refresh router dan arahkan sesuai role atau callbackUrl
      const destination =
        json.redirectTo ||
        (json.user?.role === "CASHIER"
          ? "/cashier"
          : json.user?.role === "MANAGER"
          ? "/manager"
          : callbackUrl !== "/admin" &&
            callbackUrl !== "/cashier" &&
            callbackUrl !== "/manager"
          ? callbackUrl
          : "/admin");

      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 500);
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi. Pastikan server aktif.");
      setIsLoading(false);
    }
  };

  const handleFillDemo = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-brand selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-md space-y-6">
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand text-white shadow-lg shadow-brand/25 mb-1 transform hover:scale-105 transition-transform p-3">
            <LogoKantinMini className="w-full h-full text-white drop-shadow-xs" />
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            Kantin Mini Admin
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">
            Masuk untuk mengelola katalog menu, kasir POS, dan laporan pesanan.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-surface-border shadow-xl shadow-black/5 space-y-6">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success State */}
          {isSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Login berhasil! Mengalihkan ke panel admin...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Username/Email */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-ink block">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  disabled={isLoading || isSuccess}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white border border-surface-border text-sm font-semibold text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all disabled:opacity-60"
                  autoFocus
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-ink">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading || isSuccess}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white border border-surface-border text-sm font-semibold text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="btn-press w-full py-3.5 px-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-md shadow-brand/25 hover:bg-brand-hover transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              {isLoading || isSuccess ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Panel Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Akun Default Demo (Bantuan Pengujian) */}
          <div className="pt-4 border-t border-surface-border space-y-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block text-center">
              Pilihan Akun Demo (Klik untuk isi cepat):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo("admin", "admin123")}
                className="btn-press p-2.5 rounded-xl border border-surface-border bg-surface-subtle hover:bg-brand-light hover:border-brand/30 text-left transition-colors cursor-pointer text-xs"
              >
                <div className="font-bold text-ink flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5 truncate">
                  admin &bull; admin123
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("manager", "manager123")}
                className="btn-press p-2.5 rounded-xl border border-surface-border bg-surface-subtle hover:bg-brand-light hover:border-brand/30 text-left transition-colors cursor-pointer text-xs"
              >
                <div className="font-bold text-ink flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manager</span>
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5 truncate">
                  manager &bull; manager123
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("kasir1", "kasir123")}
                className="btn-press p-2.5 rounded-xl border border-surface-border bg-surface-subtle hover:bg-brand-light hover:border-brand/30 text-left transition-colors cursor-pointer text-xs"
              >
                <div className="font-bold text-ink flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kasir</span>
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5 truncate">
                  kasir1 &bull; kasir123
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Link kembali ke Web Pelanggan */}
        <div className="text-center">
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-brand transition-colors"
          >
            <span>Buka Web Pemesanan Pelanggan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
