import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hashPassword } from "@/lib/auth";

// GET /api/admin/users - Mengambil daftar akun pengguna (Hanya Admin)
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Fitur ini hanya untuk Owner / Admin." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        pinHash: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        hasPin: Boolean(u.pinHash),
        pinHash: undefined, // Sembunyikan PIN hash asli
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data pengguna." },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Membuat akun baru (Hanya Admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Fitur ini hanya untuk Owner / Admin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, username, email, password, role, pin } = body;

    // Validasi input
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    if (!username?.trim()) {
      return NextResponse.json(
        { success: false, error: "Username wajib diisi." },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, error: "Kata sandi minimal 4 karakter." },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "MANAGER", "CASHIER"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role tidak valid. Pilih Admin, Manager, atau Kasir." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email?.trim()?.toLowerCase() || null;

    // Cek duplikasi username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return NextResponse.json(
          { success: false, error: `Username "${cleanUsername}" sudah digunakan.` },
          { status: 400 }
        );
      }
      if (cleanEmail && existingUser.email === cleanEmail) {
        return NextResponse.json(
          { success: false, error: `Email "${cleanEmail}" sudah terdaftar.` },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Buat akun di database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        pinHash: pin?.trim() || null,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${newUser.name} (${newUser.role}) berhasil dibuat!`,
      data: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat akun pengguna." },
      { status: 500 }
    );
  }
}
