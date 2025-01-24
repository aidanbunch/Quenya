import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const slug = (formData.get("slug") as string) || nanoid(10);
    const viewOnce = formData.get("viewOnce") === "true";
    const mediaType = formData.get("mediaType") as string || "image";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 100MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/ogg"
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${slug}${getExtension(file.type)}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create database record
    const media = await prisma.media.create({
      data: {
        slug,
        url: publicUrl,
        mimeType: file.type,
        mediaType,
        size: file.size,
        viewOnce,
        expiresAt,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Media uploaded successfully!",
      slug: media.slug
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}

function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
  };
  return extensions[mimeType] || "";
} 