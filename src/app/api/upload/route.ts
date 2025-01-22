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

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
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
      .from("images")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create database record
    const image = await prisma.image.create({
      data: {
        slug,
        url: publicUrl,
        mimeType: file.type,
        size: file.size,
        viewOnce,
        expiresAt,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Image uploaded successfully!",
      slug: image.slug
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
  };
  return extensions[mimeType] || "";
} 