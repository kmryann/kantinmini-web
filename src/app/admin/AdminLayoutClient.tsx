"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Users,
  Store,
  Menu as MenuIcon,
  X,
  ExternalLink,
  LogOut,
  User as UserIcon,
  Shield,
  Loader2,
  ChefHat,
  Settings,
} from "lucide-react";
import { LogoKantinMini } from "@/components/common/LogoKantinMini";
import type { AdminSessionPayload } from "@/lib/auth";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  currentUser?: AdminSessionPayload | null;
}

const getNavItemsForRole = (role: string) => {
  if (role === "CASHIER") {
    return [
      {
        name: "POS Kasir",
        href: "/cashier",
        icon: Store,
        exact: true,
      },
      {
        name: "Pesanan Masuk",
        href: "/cashier/orders",
        icon: ChefHat,
        exact: false,
      },
      {
        name: "Laporan Transaksi",
        href: "/cashier/transactions",
        icon: Receipt,
        exact: false,
      },
    ];
  }
  if (role === "MANAGER") {
    return [
      {
        name: "Dashboard",
        href: "/manager",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        name: "Laporan Transaksi",
        href: "/manager/transactions",
        icon: Receipt,
        exact: false,
      },
      {
        name: "Ubah Menu",
        href: "/manager/menu",
        icon: UtensilsCrossed,
        exact: false,
      },
      {
        name: "Pengaturan Mode",
        href: "/manager/settings",
        icon: Settings,
        exact: false,
      },
    ];
  }
  // Default: ADMIN
  return [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Laporan Transaksi",
      href: "/admin/transactions",
      icon: Receipt,
      exact: false,
    },
    {
      name: "Manajemen Menu",
      href: "/admin/menu",
      icon: UtensilsCrossed,
      exact: false,
    },
    {
      name: "Kelola Akun",
      href: "/admin/users",
      icon: Users,
      exact: false,
    },
    {
      name: "Pengaturan Mode",
      href: "/admin/settings",
      icon: Settings,
      exact: false,
    },
  ];
};

export default function AdminLayoutClient({
  children,
  currentUser,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  // 1. SEMUA HOOKS DI-EKSEKUSI DI BAGIAN PALING ATAS (MENCEGAH ERROR ORDER OF HOOKS)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kantin_admin_sidebar_collapsed");
      if (saved === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const userRole = currentUser?.role || "ADMIN";

  const navItems = React.useMemo(() => {
    return getNavItemsForRole(userRole);
  }, [userRole]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kantin_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isNavActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getPageInfo = () => {
    if (pathname === "/admin" || pathname === "/manager") {
      return {
        title: "Dashboard Keuangan",
        subtitle: "Laporan omzet, metrik penjualan, dan performa pesanan",
        badge: "Dashboard",
      };
    }
    if (pathname === "/cashier") {
      return {
        title: "Point of Sale (POS)",
        subtitle: "Layar kasir cepat pesanan meja & takeaway",
        badge: "Kasir",
      };
    }
    if (pathname.startsWith("/cashier/transactions")) {
      return {
        title: "Laporan Transaksi Kasir",
        subtitle: "Daftar riwayat transaksi kasir dan cetak ulang nota",
        badge: "Kasir",
      };
    }
    if (pathname.startsWith("/manager/transactions") || pathname.startsWith("/admin/transactions")) {
      return {
        title: "Laporan Transaksi",
        subtitle: "Riwayat pesanan, rincian pembayaran, dan nota",
        badge: "Transaksi",
      };
    }
    if (pathname.startsWith("/manager/menu")) {
      return {
        title: "Ubah Menu",
        subtitle: "Kelola ketersediaan menu dan produk kantin",
        badge: "Katalog",
      };
    }
    if (pathname.startsWith("/admin/menu")) {
      return {
        title: "Manajemen Menu",
        subtitle: "Kelola produk, harga, ketersediaan, dan urutan menu",
        badge: "Katalog",
      };
    }
    if (pathname.startsWith("/admin/users")) {
      return {
        title: "Kelola Akun & Role",
        subtitle: "Buat dan atur hak akses akun Kasir, Manager, dan Admin",
        badge: "Pengguna",
      };
    }
    return {
      title: userRole === "CASHIER" ? "Kasir Kantin" : userRole === "MANAGER" ? "Manager Panel" : "Admin Panel",
      subtitle: "Kantin Mini Administration",
      badge: "Sistem",
    };
  };

  const pageInfo = getPageInfo();

  // 2. JIKA HALAMAN LOGIN, KEMBALIKAN CHILDREN SETELAH SEMUA HOOKS SELESAI DIPANGGIL
  if (pathname === "/login" || pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased selection:bg-brand selection:text-white">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-brand text-white px-4 py-3 flex items-center justify-between shadow-xs sticky top-0 z-40 border-b border-brand-hover">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            aria-label="Buka Menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-white p-1.5 shrink-0 shadow-2xs">
              <LogoKantinMini className="w-full h-full text-white drop-shadow-xs" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">{pageInfo.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase">
            {currentUser?.role || "ADMIN"}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-rose-500/80 text-white transition-all cursor-pointer"
            title="Keluar / Logout"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Desktop & Mobile (Warna Hijau Brand) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen md:h-dvh z-50 md:z-30 bg-brand text-white border-r border-brand-hover flex flex-col overflow-hidden transition-all duration-300 ease-in-out shadow-lg md:shadow-none ${
          /* Mobile classes */
          isMobileOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        } ${
          /* Desktop collapsed classes */
          isCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {/* Sidebar Header / Logo (Klik logo untuk collapse/expand) */}
        <div
          className={`h-16 border-b border-white/15 flex items-center px-4 shrink-0 transition-all ${
            isCollapsed ? "justify-center px-2" : "justify-between"
          }`}
        >
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center gap-3 overflow-hidden group/logo cursor-pointer text-left focus:outline-hidden"
            title={
              isCollapsed
                ? "Klik logo untuk memperluas sidebar"
                : "Klik logo untuk menciutkan sidebar"
            }
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs group-hover/logo:scale-105 group-active/logo:scale-95 transition-all p-1.5">
              <LogoKantinMini className="w-full h-full text-white drop-shadow-xs" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm tracking-tight text-white truncate leading-tight group-hover/logo:text-white/90 transition-colors">
                  Kantin Mini
                </span>
                <span className="text-[10px] font-bold text-white/75 uppercase tracking-wider truncate">
                  {userRole === "CASHIER"
                    ? "Kasir Panel"
                    : userRole === "MANAGER"
                    ? "Manager Panel"
                    : "Admin Panel"}
                </span>
              </div>
            )}
          </button>

          {/* Close button on Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const active = isNavActive(item.href, item.exact);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={`btn-press group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  active
                    ? "bg-white text-brand shadow-sm font-black"
                    : "text-white/85 hover:text-white hover:bg-white/15 font-semibold"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    active ? "text-brand" : "text-white/85 group-hover:text-white"
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer: Hanya Tombol Logout & Web Pelanggan */}
        <div className="p-3 border-t border-white/15 space-y-2 shrink-0">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn-press w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-rose-500/25 hover:border-rose-400/40 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
              title="Keluar dari Admin Panel"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LogOut className="w-4 h-4 text-white" />
              )}
              <span>Logout</span>
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn-press p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/25 text-white transition-all cursor-pointer"
                title="Keluar / Logout"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Quick link to customer ordering site */}
          {!isCollapsed ? (
            <Link
              href="/order"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all"
            >
              <span className="flex items-center gap-2 truncate">
                <ExternalLink className="w-3.5 h-3.5 text-white" />
                <span>Web Pelanggan</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </Link>
          ) : (
            <Link
              href="/order"
              target="_blank"
              title="Buka Web Pelanggan"
              className="hidden md:flex justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
