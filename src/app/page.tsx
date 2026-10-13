import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { LogoKantinMini } from "@/components/common/LogoKantinMini";
import {
  UtensilsCrossed,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  ChefHat,
  HeartHandshake,
  QrCode,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export const revalidate = 60;

export default async function Home() {
  // Ambil beberapa menu favorit / best seller untuk preview di landing page
  let popularMenus: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string;
    category: { name: string };
  }> = [];

  let storeSetting = {
    whatsappNumber: "085117693117",
    orderMode: "WHATSAPP",
  };

  try {
    const [rawMenus, setting] = await Promise.all([
      prisma.menuItem.findMany({
        take: 6,
        orderBy: [{ sortOrder: "asc" }, { price: "desc" }],
        include: { category: true },
      }),
      prisma.storeSetting.findUnique({
        where: { id: "default" },
      }),
    ]);

    popularMenus = rawMenus;
    if (setting) {
      storeSetting = {
        whatsappNumber: setting.whatsappNumber || "085117693117",
        orderMode: setting.orderMode || "WHATSAPP",
      };
    }
  } catch (err) {
    console.error("Error prefetching landing page data:", err);
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-brand selection:text-white">
      {/* 1. TOP NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center p-2 shadow-md group-hover:scale-105 transition-transform">
              <LogoKantinMini className="w-full h-full text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight text-white leading-tight">
                Kantin Mini
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300/90 tracking-wide">
                Fresh & Crispy Everyday
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/order"
              className="hidden sm:inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90 hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              <span>Daftar Menu</span>
            </Link>

            <Link
              href="/login"
              className="btn-press text-xs sm:text-sm font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-xl transition-colors"
            >
              Login Staff
            </Link>

            <Link
              href="/order"
              className="btn-press inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <span>Pesan Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION DENGAN BACKGROUND FOTO CHICKEN KATSU */}
      <section className="relative min-h-[92vh] sm:min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/hero-katsu.webp"
            alt="Crispy Chicken Katsu Kantin Mini"
            fill
            priority
            quality={90}
            className="object-cover object-center scale-105 animate-in fade-in zoom-in-105 duration-1000"
          />
          {/* Multi-layered Vignette Overlay: Menjamin teks sangat tajam & terbaca */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/75 to-gray-950/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/60 to-transparent" />
          <div className="absolute inset-0 backdrop-blur-[1.5px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-8 sm:pt-12">
          <div className="max-w-2xl space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md shadow-inner">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Sensasi Renyah, Gurih & Selalu Fresh</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] drop-shadow-md">
              Kelezatan Spesial, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                Hangat & Renyah
              </span>{" "}
              di Setiap Gigitan.
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-200/90 font-medium leading-relaxed max-w-xl drop-shadow-sm">
              Nikmati aneka pilihan Chicken Katsu renyah, olahan ayam bumbu rempah, pempek asli, hingga aneka minuman segar. Pesan praktis langsung dari genggaman Anda.
            </p>

            {/* Action Buttons (CTAs) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/order"
                className="btn-press flex items-center justify-center gap-2.5 px-6 py-3.5 sm:py-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand/30 transition-all active:scale-[0.98]"
              >
                <UtensilsCrossed className="w-5 h-5" />
                <span>Lihat Menu & Pesan</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <a
                href={`https://wa.me/62${storeSetting.whatsappNumber.replace(/^0/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press flex items-center justify-center gap-2 px-5 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-md transition-all active:scale-[0.98]"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Hubungi WhatsApp</span>
              </a>
            </div>

            {/* Value Props Chips */}
            <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-3 sm:gap-6 text-white/90">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">100% Halal</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <ChefHat className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">Bumbu Otentik</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">Penyajian Cepat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MENU PREVIEW HIGHLIGHT SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-surface border-y border-surface-border">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Katalog Pilihan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                Menu Favorit Kantin Mini
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-md">
                Pilihan menu paling banyak dipesan yang siap memanjakan lidah Anda.
              </p>
            </div>

            <Link
              href="/order"
              className="btn-press inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand hover:text-brand-hover self-start sm:self-auto"
            >
              <span>Lihat Semua Menu (37 Pilihan)</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularMenus.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-surface-border shadow-xs hover:shadow-md hover:border-brand/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-surface-subtle">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-950/70 text-white backdrop-blur-xs">
                      {item.category.name}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-ink group-hover:text-brand transition-colors">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-surface-subtle flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-ink-muted block font-medium">Harga</span>
                    <span className="text-base font-black text-ink">
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <Link
                    href={`/order?search=${encodeURIComponent(item.name)}`}
                    className="btn-press px-3.5 py-1.5 rounded-xl bg-brand-light text-brand font-bold text-xs hover:bg-brand hover:text-white transition-colors"
                  >
                    Pesan
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link
              href="/order"
              className="btn-press inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-sm transition-all"
            >
              <span>Buka Menu Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. CARA PEMESANAN MUDAH (3 LANGKAH) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-canvas">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-brand">
              Praktis & Tanpa Antre
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              3 Langkah Mudah Memesan
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Pesan hidangan favorit Anda kapan saja secara mandiri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 border border-surface-border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand mx-auto flex items-center justify-center font-black text-lg border border-brand/20">
                1
              </div>
              <h3 className="font-extrabold text-base text-ink">Pilih Menu</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Buka katalog online kami di smartphone Anda. Pilih aneka hidangan, tentukan jumlah porsi dan varian rasa.
              </p>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-surface-border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center font-black text-lg border border-amber-500/20">
                2
              </div>
              <h3 className="font-extrabold text-base text-ink">Checkout Pesanan</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Tulis nama Anda dan pilih apakah ingin makan di tempat (Dine In) atau dibungkus (Takeaway).
              </p>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-surface-border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center font-black text-lg border border-blue-500/20">
                3
              </div>
              <h3 className="font-extrabold text-base text-ink">Kirim via WhatsApp / Kasir</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Rincian pesanan langsung terkirim rapi ke WhatsApp kami atau diproses oleh kasir tanpa ribet mencatat manual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto bg-gray-950 text-white border-t border-white/10 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center p-1.5">
                <LogoKantinMini className="w-full h-full text-white" />
              </div>
              <span className="font-black text-base tracking-tight text-white">
                Kantin Mini
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Sajian lezat, hangat, dan higienis setiap hari.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300 font-semibold">
            <Link href="/order" className="hover:text-emerald-400 transition-colors">
              Menu Pelanggan
            </Link>
            <Link href="/login" className="hover:text-emerald-400 transition-colors">
              Portal Kasir & Manager
            </Link>
            <a
              href={`https://wa.me/62${storeSetting.whatsappNumber.replace(/^0/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              WhatsApp: {storeSetting.whatsappNumber}
            </a>
          </div>

          <div className="text-xs text-gray-400">
            © {new Date().getFullYear()} Kantin Mini. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
