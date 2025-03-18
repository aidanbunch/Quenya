import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getFileExtension } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Find media to delete based on these conditions:
    // 1. Media with viewOnce=false (24-hour expiry) where expiresAt is in the past
    // 2. Media with viewOnce=true that have been viewed (viewed=true)
    const expiredMedia = await prisma.media.findMany({
      where: {
        OR: [
          // 24-hour expiry media that have expired
          {
            viewOnce: false,
            expiresAt: {
              lt: new Date(),
            },
          },
          // "View once" media that have been viewed
          {
            viewOnce: true,
            viewed: true,
          },
        ],
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
