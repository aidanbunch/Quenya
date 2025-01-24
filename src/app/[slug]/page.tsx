import { MediaUploader } from "@/components/MediaUploader";
import { ImageViewer } from "@/components/ImageViewer";
import { VideoViewer } from "@/components/VideoViewer";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

// Define the type since Prisma doesn't export it
type Media = {
  id: string;
  slug: string;
  url: string;
  mimeType: string;
  mediaType: string;
  size: number;
  viewOnce: boolean;
  viewed: boolean;
  expiresAt: Date;
};

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function deleteMedia(media: Media) {
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      // Start a transaction to ensure both operations complete or neither does
      await prisma.$transaction(async (tx) => {
        // First verify the media still exists and hasn't been deleted
        const currentMedia = await tx.media.findUnique({
          where: { id: media.id },
        });

        if (!currentMedia) {
          console.log(`Media ${media.id} already deleted from database`);
          return;
        }

        // Delete from database first
        await tx.media.delete({
          where: { id: media.id },
        });

        // Then attempt storage deletion
        const fileName = `${media.slug}${getExtension(media.mimeType)}`;
        const { error } = await supabase.storage.from("media").remove([fileName]);
        
        if (error) {
          // Log the error but don't throw - the database deletion is more important
          console.error(`Failed to delete from storage: ${fileName}`, error);
        } else {
          console.log(`Successfully deleted media ${media.id} (${fileName})`);
        }
      });
      
      // If we get here, the operation was successful
      return;
      
    } catch (error) {
      attempt++;
      
      // Only retry on connection errors
      if (error instanceof Error && 
          (error.message.includes('Connection') || 
           error.message.includes('timeout') ||
           error.message.includes('disconnect'))) {
        
        if (attempt < MAX_RETRIES) {
          const delayMs = BASE_DELAY_MS * attempt;
          console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
          await sleep(delayMs);
          continue;
        }
      }
      
      // For other errors or if we've exhausted retries, log and throw
      console.error(`Error deleting media ${media.id} (attempt ${attempt}/${MAX_RETRIES}):`, error);
      throw error;
    }
  }
}

type Params = Promise<{ slug: string }>;

export default async function SlugPage({
  params,
}: {
  params: Params;
}) {
  try {
    const { slug } = await params;
    
    const media = await prisma.media.findUnique({
      where: { slug },
    });

    // If no media exists, show the upload interface
    if (!media) {
      return <MediaUploader slug={slug} />;
    }

    // Check if media has expired
    const isExpired = new Date() > new Date(media.expiresAt);
    if (isExpired) {
      console.log(`Media ${media.id} has expired, deleting...`);
      await deleteMedia(media);
      return <MediaUploader slug={slug} />;
    }

    // For view-once media, mark as viewed if this is the first view
    if (media.viewOnce && !media.viewed) {
      await prisma.media.update({
        where: { id: media.id },
        data: { viewed: true },
      });
    }
    
    // If it's a view-once media that's been viewed (but not expired), delete it
    if (media.viewOnce && media.viewed) {
      console.log(`View-once media ${media.id} has been viewed, deleting...`);
      await deleteMedia(media);
      return <MediaUploader slug={slug} />;
    }

    // Show the appropriate viewer interface with the data
    const ViewerComponent = media.mediaType === "video" ? VideoViewer : ImageViewer;
    return <ViewerComponent 
      slug={slug}
      initialData={{
        url: media.url,
        mimeType: media.mimeType,
        viewOnce: media.viewOnce,
        expiresAt: media.expiresAt.toISOString(),
      }}
    />;
  } catch (error) {
    console.error('Error in SlugPage:', error);
    // Return a simple error UI rather than crashing
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          Something went wrong. Please try again later.
        </div>
      </div>
    );
  }
} 