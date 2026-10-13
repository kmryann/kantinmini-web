import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

    // Validasi tipe mime
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format file harus PNG atau JPG (maksimal 6MB)" },
        { status: 400 }
      );
    }

    // Batas maksimal 6MB
    const MAX_SIZE = 6 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran file melebihi batas maksimal 6MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Konversi PNG / JPG apa pun ke format WebP terkompresi dengan sharp
    const webpBuffer = await sharp(inputBuffer)
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Nama file unik dengan ekstensi .webp
    const originalExt = path.extname(file.name) || ".jpg";
    const baseName =
      path
        .basename(file.name, originalExt)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "menu";

    const filename = `menu_${Date.now()}_${baseName}.webp`;

    let publicUrl = "";

    // 1. Coba upload ke Supabase Storage (Bucket: 'menu-images')
    if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("menu-images")
          .upload(filename, webpBuffer, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage
            .from("menu-images")
            .getPublicUrl(filename);

          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        } else {
          console.warn("Supabase upload notice:", uploadError?.message);
        }
      } catch (err) {
        console.warn("Failed uploading to Supabase Storage, fallback to local:", err);
      }
    }

    // 2. Fallback lokal ke public/uploads jika upload Supabase gagal atau di dev offline
    if (!publicUrl) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, webpBuffer);
        publicUrl = `/uploads/${filename}`;
      } catch (fsErr) {
        console.error("Local disk write error:", fsErr);
        if (!publicUrl) {
          throw new Error("Gagal menyimpan file gambar ke storage");
        }
      }
    }

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
