import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const image = await prisma.image.findUnique({
    where: { slug },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Check if image has expired
  if (new Date() > new Date(image.expiresAt)) {
    // Delete the image from storage and database
    const fileName = `${slug}${getExtension(image.mimeType)}`;
    await supabase.storage.from("images").remove([fileName]);
    await prisma.image.delete({
      where: { id: image.id },
    });
    return NextResponse.json({ error: "Image has expired" }, { status: 410 });
  }

  // If image is view-once and has been viewed, delete it
  if (image.viewOnce && image.viewed) {
    const fileName = `${slug}${getExtension(image.mimeType)}`;
    await supabase.storage.from("images").remove([fileName]);
    await prisma.image.delete({
      where: { id: image.id },
    });
    return NextResponse.json({ error: "Image has been viewed" }, { status: 410 });
  }

  // Mark as viewed if it's a view-once image
  if (image.viewOnce) {
    await prisma.image.update({
      where: { id: image.id },
      data: { viewed: true },
    });
  }

  return NextResponse.json({
    url: image.url,
    mimeType: image.mimeType,
    viewOnce: image.viewOnce,
    expiresAt: image.expiresAt,
  });
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