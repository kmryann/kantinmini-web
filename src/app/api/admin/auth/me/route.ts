import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Tidak ada sesi aktif" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.userId,
      name: session.name,
      username: session.username,
      email: session.email,
      role: session.role,
    },
  });
}
