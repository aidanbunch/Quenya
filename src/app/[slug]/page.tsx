import { ImageUploader } from "@/components/ImageUploader";
import { ImageViewer } from "@/components/ImageViewer";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

// Define the type since Prisma doesn't export it
type Image = {
  id: string;
  slug: string;
  url: string;
  mimeType: string;
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
  };
  return extensions[mimeType] || "";
}

async function deleteImage(image: Image) {
  // Delete from storage
  const fileName = `${image.slug}${getExtension(image.mimeType)}`;
  await supabase.storage.from("images").remove([fileName]);
  
  // Delete from database
  await prisma.image.delete({
    where: { id: image.id },
  });
}

export default async function SlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  
  const image = await prisma.image.findUnique({
    where: { slug },
  });

  // If no image exists, show the upload interface
  if (!image) {
    return <ImageUploader slug={slug} />;
  }

  // Check if image has expired
  const isExpired = new Date() > new Date(image.expiresAt);
  if (isExpired) {
    await deleteImage(image);
    return <ImageUploader slug={slug} />;
  }

  // For view-once images, mark as viewed if this is the first view
  if (image.viewOnce && !image.viewed) {
    await prisma.image.update({
      where: { id: image.id },
      data: { viewed: true },
    });
  }
  
  // If it's a view-once image that's been viewed (but not expired), delete it
  if (image.viewOnce && image.viewed) {
    await deleteImage(image);
    return <ImageUploader slug={slug} />;
  }

  // Show the viewer interface with the data
  return <ImageViewer 
    slug={slug}
    initialData={{
      url: image.url,
      mimeType: image.mimeType,
      viewOnce: image.viewOnce,
      expiresAt: image.expiresAt,
    }}
  />;
} 