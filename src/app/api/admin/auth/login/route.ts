import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  verifyPassword,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "Username/Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();

    // Cari user berdasarkan username atau email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Username atau kata sandi tidak sesuai" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Akun Anda telah dinonaktifkan. Hubungi admin utama." },
        { status: 403 }
      );
    }

    // Role check: izinkan ADMIN, MANAGER, dan CASHIER
    if (!["ADMIN", "MANAGER", "CASHIER"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Akun ini tidak memiliki hak akses." },
        { status: 403 }
      );
    }

    // Verifikasi password atau PIN kasir
    let isPasswordValid = false;
    if (user.passwordHash) {
      isPasswordValid = await verifyPassword(password, user.passwordHash);
    }
    if (!isPasswordValid && user.pinHash) {
      isPasswordValid = user.pinHash === password;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Username atau kata sandi tidak sesuai" },
        { status: 401 }
      );
    }

    // Tentukan halaman tujuan berdasarkan role
    const redirectTo =
      user.role === "CASHIER"
        ? "/cashier"
        : user.role === "MANAGER"
        ? "/manager"
        : "/admin";

    // Buat session token
    const token = await createSessionToken({
      userId: user.id,
      name: user.name,
      username: user.username || user.email?.split("@")[0] || "admin",
      email: user.email,
      role: user.role,
    });

    // Siapkan response
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Error in admin login:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server saat proses login" },
      { status: 500 }
    );
  }
}
