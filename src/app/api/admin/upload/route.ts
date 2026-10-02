import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada file yang diunggah" },
        { status: 400 }
      );
    }

    // Validate mime type: PNG or JPG/JPEG (or WebP)
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format file harus PNG atau JPG (maksimal 6MB)" },
        { status: 400 }
      );
    }

    // Limit size to 6MB
    const MAX_SIZE = 6 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran file melebihi batas maksimal 6MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Convert to WebP format using sharp with high quality and optimization
    const webpBuffer = await sharp(inputBuffer)
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Generate sanitized .webp filename
    const originalExt = path.extname(file.name) || ".jpg";
    const baseName =
      path
        .basename(file.name, originalExt)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "menu";

    const filename = `menu_${Date.now()}_${baseName}.webp`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, webpBuffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      originalSize: file.size,
      convertedSize: webpBuffer.length,
      format: "webp",
    });
  } catch (error) {
    console.error("Upload & WebP conversion error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses dan mengonversi gambar ke WebP" },
      { status: 500 }
    );
  }
}
