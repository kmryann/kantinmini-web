import Link from "next/link";
import { Utensils, MonitorCheck, ShieldCheck, QrCode } from "lucide-react";

export default function Home() {
  const tables = [1, 2, 3, 4, 5, 6, 7];

  return (
    <main className="min-h-screen bg-canvas text-ink px-4 py-12 md:py-20 max-w-4xl mx-auto flex flex-col items-center">
      {/* Header Brand */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-light text-brand text-sm font-semibold tracking-wide border border-brand-muted/40">
          <Utensils className="w-4 h-4" />
          Kantin Mini Ecosystem
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight display-title text-ink">
          Integrated Web Ordering & POS
        </h1>
        <p className="text-ink-muted text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Sistem pemesanan mandiri di meja, tablet kasir real-time, dan manajemen operasional terintegrasi.
        </p>
      </div>

      {/* Role Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        {/* Customer Access */}
        <div className="bg-surface rounded-2xl p-6 border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-ink">Pelanggan (Customer)</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Scan QR di meja untuk memilih menu, custom saus, checkout Pay First (QRIS / Tunai), dan pantau hidangan.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-subtle">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint block mb-2">
              Pilih Meja untuk Demo:
            </span>
            <div className="flex flex-wrap gap-2">
              {tables.map((tableNum) => (
                <Link
                  key={tableNum}
                  href={`/order?table=${tableNum}`}
                  className="btn-press px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-brand-light hover:text-brand text-xs font-bold text-ink-secondary border border-surface-border transition-colors"
                >
                  Meja {tableNum}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Cashier POS */}
        <div className="bg-surface rounded-2xl p-6 border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/50">
              <MonitorCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-ink">Kasir (Tablet POS)</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Grid visual 7 Meja, konfirmasi tunai, auto-print thermal 2 rangkap (struk & tiket dapur), dan kontrol alur masak.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-subtle">
            <Link
              href="/pos"
              className="btn-press w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors shadow-xs"
            >
              Buka POS Kasir
            </Link>
          </div>
        </div>

        {/* Admin & Manager */}
        <div className="bg-surface rounded-2xl p-6 border border-surface-border shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-ink">Admin & Manager</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              CMS Master Menu wajib foto, QR generator meja siap cetak, toggle status ketersediaan, otorisasi void & rekap omzet.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-subtle">
            <Link
              href="/admin"
              className="btn-press w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink hover:bg-ink-secondary text-white font-semibold text-sm transition-colors shadow-xs"
            >
              Buka Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-ink-faint border-t border-surface-border pt-6 w-full">
        Kantin Mini Web Ordering & POS • Built with Next.js App Router, Tailwind CSS & Prisma ORM
      </footer>
    </main>
  );
}
