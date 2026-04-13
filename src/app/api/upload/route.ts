import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const eventId = formData.get("eventId") as string;

  if (!file) {
    return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "画像（JPG/PNG/GIF/WebP）またはPDFのみアップロードできます" },
      { status: 400 }
    );
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "ファイルサイズは10MBまでです" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${eventId || "general"}/${nanoid()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("event-files")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "アップロードに失敗しました: " + error.message },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-files").getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
