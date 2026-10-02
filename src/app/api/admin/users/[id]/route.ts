import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hashPassword } from "@/lib/auth";

// PUT /api/admin/users/[id] - Update data akun / reset password (Hanya Admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Fitur ini hanya untuk Owner / Admin." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, username, email, role, isActive, password, pin } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "Akun pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Mencegah admin mendowngrade akunnya sendiri jika dia satu-satunya admin
    if (session.userId === id && role && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat mengubah role akun Anda sendiri dari Admin." },
        { status: 400 }
      );
    }

    // Mencegah menonaktifkan akun sendiri
    if (session.userId === id && isActive === false) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat menonaktifkan akun yang sedang digunakan." },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      username?: string;
      email?: string | null;
      role?: string;
      isActive?: boolean;
      passwordHash?: string;
      pinHash?: string | null;
    } = {};

    if (name?.trim()) updateData.name = name.trim();
    if (role && ["ADMIN", "MANAGER", "CASHIER"].includes(role)) {
      updateData.role = role;
    }
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }
    if (username?.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      // Pastikan username tidak dipakai user lain
      const duplicate = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` },
          { status: 400 }
        );
      }
      updateData.username = cleanUsername;
    }

    if (email !== undefined) {
      const cleanEmail = email?.trim()?.toLowerCase() || null;
      if (cleanEmail) {
        const duplicate = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            NOT: { id },
          },
        });
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: `Email "${cleanEmail}" sudah digunakan oleh akun lain.` },
            { status: 400 }
          );
        }
      }
      updateData.email = cleanEmail;
    }

    // Jika mengisi password baru (reset password)
    if (password && password.trim().length >= 4) {
      updateData.passwordHash = await hashPassword(password.trim());
    }

    if (pin !== undefined) {
      updateData.pinHash = pin?.trim() || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data akun ${updatedUser.name} berhasil diperbarui!`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui data akun pengguna." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Menghapus akun (Hanya Admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Fitur ini hanya untuk Owner / Admin." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Cegah admin menghapus akunnya sendiri
    if (session.userId === id) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri saat ini." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Akun tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${user.name} (${user.username || user.role}) berhasil dihapus.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus akun pengguna." },
      { status: 500 }
    );
  }
}
