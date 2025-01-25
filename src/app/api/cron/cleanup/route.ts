import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getFileExtension } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Find all expired media
    const expiredMedia = await prisma.media.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Delete each expired image from storage and database
    for (const image of expiredMedia) {
      const fileName = `${image.slug}${getFileExtension(image.mimeType)}`;
      await supabase.storage.from("media").remove([fileName]);
      await prisma.media.delete({
        where: { id: image.id },
      });
    }

    return NextResponse.json({
      success: true,
      cleaned: expiredMedia.length,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Error during cleanup" },
      { status: 500 }
    );
  }
}
