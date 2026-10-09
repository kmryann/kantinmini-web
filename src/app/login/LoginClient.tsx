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
  CheckCircle2,
  Store,
  ShieldCheck,
  Briefcase,
  Calculator,
  ArrowUpRight,
} from "lucide-react";
import { LogoKantinMini } from "@/components/common/LogoKantinMini";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

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
        setErrorMessage(
          json.error || "Gagal masuk. Periksa kembali username dan kata sandi."
        );
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);

      // Tentukan rute redirect
      const destination =
        callbackUrl &&
        callbackUrl !== "/login" &&
        callbackUrl !== "/admin/login"
          ? callbackUrl
          : json.redirectTo ||
            (json.user?.role === "CASHIER"
              ? "/cashier"
              : json.user?.role === "MANAGER"
              ? "/manager"
              : "/admin");

      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 400);
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
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-brand selection:text-white relative overflow-hidden">
      {/* Subtle Background Glow Decorative Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Central Login Container */}
      <div className="w-full max-w-[420px] space-y-6 relative z-10">
        {/* Brand & Header Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand text-white shadow-lg shadow-brand/20 mb-1 transform hover:scale-105 active:scale-95 transition-all p-2.5">
            <LogoKantinMini className="w-full h-full text-white drop-shadow-xs" />
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            Kantin Mini
          </h1>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            Portal operasional terpadu kasir POS, manajer, dan administrasi toko.
          </p>
        </div>

        {/* Main Card Form */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-surface-border shadow-xl shadow-slate-900/5 space-y-5">
          {/* Alert Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Alert Success Message */}
          {isSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Login berhasil! Mengalihkan ke halaman utama...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Username atau Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
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
                  placeholder="Masukkan username"
                  autoComplete="username"
                  disabled={isLoading || isSuccess}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs sm:text-sm font-semibold text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand focus:bg-white focus:ring-3 focus:ring-brand/15 transition-all disabled:opacity-60"
                  autoFocus
                />
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink block">
                Kata Sandi
              </label>
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
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs sm:text-sm font-semibold text-ink placeholder:text-ink-muted/50 focus:outline-hidden focus:border-brand focus:bg-white focus:ring-3 focus:ring-brand/15 transition-all disabled:opacity-60"
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

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="btn-press w-full py-3 px-4 rounded-xl bg-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-brand/20 hover:bg-brand-hover transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer pt-3 mt-2"
            >
              {isLoading || isSuccess ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Switcher */}
          <div className="pt-4 border-t border-surface-border space-y-2">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block text-center">
              Pilihan Akun Demo (Klik untuk isi):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo("admin", "admin123")}
                className="btn-press p-2 rounded-xl border border-surface-border bg-surface-subtle/60 hover:bg-white hover:border-brand/40 text-center transition-all cursor-pointer group"
                title="Masuk sebagai Administrator"
              >
                <ShieldCheck className="w-4 h-4 text-brand mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-ink text-[11px] block">Admin</span>
                <span className="text-[9px] text-ink-muted block truncate">admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("manager", "manager123")}
                className="btn-press p-2 rounded-xl border border-surface-border bg-surface-subtle/60 hover:bg-white hover:border-brand/40 text-center transition-all cursor-pointer group"
                title="Masuk sebagai Manager"
              >
                <Briefcase className="w-4 h-4 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-ink text-[11px] block">Manager</span>
                <span className="text-[9px] text-ink-muted block truncate">manager123</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("kasir1", "kasir123")}
                className="btn-press p-2 rounded-xl border border-surface-border bg-surface-subtle/60 hover:bg-white hover:border-brand/40 text-center transition-all cursor-pointer group"
                title="Masuk sebagai Kasir POS"
              >
                <Calculator className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-ink text-[11px] block">Kasir</span>
                <span className="text-[9px] text-ink-muted block truncate">kasir123</span>
              </button>
            </div>
          </div>
        </div>

        {/* Link kembali ke Halaman Web Pemesanan Pelanggan */}
        <div className="text-center pt-1">
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-brand transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Tampilan Web Pemesanan Pelanggan</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </Link>
        </div>
      </div>
    </div>
  );
}
