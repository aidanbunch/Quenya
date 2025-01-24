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

async function deleteMedia(media: Media) {
  // Delete from storage
  const fileName = `${media.slug}${getExtension(media.mimeType)}`;
  await supabase.storage.from("media").remove([fileName]);
  
  // Delete from database
  await prisma.media.delete({
    where: { id: media.id },
  });
}

type Params = Promise<{ slug: string }>;

export default async function SlugPage({
  params,
}: {
  params: Params;
}) {
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
} 