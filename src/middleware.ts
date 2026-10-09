import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Abaikan file statis, next internal, gambar, dan favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/menu") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Cek apakah ini rute terproteksi (admin, manager, atau cashier) atau halaman login
  const isAdminPage = pathname.startsWith("/admin");
  const isManagerPage = pathname.startsWith("/manager");
  const isCashierPage = pathname.startsWith("/cashier");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isCashierApi = pathname.startsWith("/api/cashier");
  const isLoginPage = pathname === "/login";
  const isAdminLoginPage = pathname === "/admin/login";

  // Redirect /admin/login ke /login
  if (isAdminLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!isAdminPage && !isManagerPage && !isCashierPage && !isAdminApi && !isCashierApi && !isLoginPage) {
    return NextResponse.next();
  }

  // 3. Endpoint & Halaman Publik yang tidak memerlukan login
  const isAuthApi = pathname.startsWith("/api/admin/auth");

  // Baca session cookie
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = Boolean(session);

  // A. Jika mengakses halaman login tapi sudah login, alihkan sesuai role
  if (isLoginPage) {
    if (isAuthenticated && session) {
      const destination =
        session.role === "CASHIER"
          ? "/cashier"
          : session.role === "MANAGER"
          ? "/manager"
          : "/admin";
      return NextResponse.redirect(new URL(destination, req.url));
    }
    return NextResponse.next();
  }

  // B. Jika rute API auth (login/logout), izinkan lewat
  if (isAuthApi) {
    return NextResponse.next();
  }

  // C. Jika belum login
  if (!isAuthenticated || !session) {
    // Untuk API, kembalikan respons 401 JSON
    if (isAdminApi || isCashierApi) {
      return NextResponse.json(
        { success: false, error: "Sesi login kedaluwarsa atau tidak sah. Silakan login kembali." },
        { status: 401 }
      );
    }

    // Untuk Halaman, redirect ke halaman login dengan callbackUrl
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/admin" && pathname !== "/manager" && pathname !== "/cashier") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // D. Role-Based Access Control (RBAC) untuk pengguna yang sudah login
  const { role } = session;

  // 1. Role CASHIER:
  // - Hanya boleh mengakses halaman /cashier/* dan API terkait kasir (transactions, orders, pos)
  // - Jika mencoba mengakses /admin/* atau /manager/*, alihkan ke /cashier
  if (role === "CASHIER") {
    if (isAdminPage || isManagerPage) {
      return NextResponse.redirect(new URL("/cashier", req.url));
    }
    const isAllowedCashierApi =
      pathname.startsWith("/api/admin/transactions") ||
      pathname.startsWith("/api/admin/orders") ||
      pathname.startsWith("/api/admin/pos");

    if (isAdminApi && !isAllowedCashierApi) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Fitur ini hanya untuk Admin/Manager." },
        { status: 403 }
      );
    }
  }

  // 2. Role MANAGER:
  // - Boleh mengakses /manager/*
  // - Jika mengakses /admin/*, alihkan ke /manager (atau jika /admin/users, tolak)
  // - TIDAK boleh mengakses /admin/users (Kelola Akun) -> redirect ke /manager
  // - TIDAK boleh mengakses /cashier (karena POS hanya di kasir) -> redirect ke /manager
  if (role === "MANAGER") {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/manager", req.url));
    }
    if (pathname.startsWith("/api/admin/users")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Manajemen akun hanya untuk Owner / Admin." },
        { status: 403 }
      );
    }
    if (isCashierPage) {
      return NextResponse.redirect(new URL("/manager", req.url));
    }
  }

  // 3. Role ADMIN: Memiliki akses penuh
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/login",
    "/admin/:path*",
    "/manager/:path*",
    "/cashier/:path*",
    "/api/admin/:path*",
    "/api/cashier/:path*",
  ],
};
