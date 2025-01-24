"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const UPLOAD_ASCII = `
⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⢠⡆⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⣷⣄⠀⠀⠀⠀⣾⣷⠀⠀⠀⠀⣠⣾⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢿⠿⠃⠀⠀⠀⠉⠉⠁⠀⠀⠐⠿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⣤⣤⣶⣶⣶⣤⣤⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣠⣶⣿⣿⡿⣿⣿⣿⡿⠋⠉⠀⠀⠉⠙⢿⣿⣿⡿⣿⣿⣷⣦⡀⠀⠀⠀
⠀⢀⣼⣿⣿⠟⠁⢠⣿⣿⠏⠀⠀⢠⣤⣤⡀⠀⠀⢻⣿⣿⡀⠙⢿⣿⣿⣦⠀⠀
⣰⣿⣿⡟⠁⠀⠀⢸⣿⣿⠀⠀⠀⢿⣿⣿⡟⠀⠀⠈⣿⣿⡇⠀⠀⠙⣿⣿⣷⡄
⠈⠻⣿⣿⣦⣄⠀⠸⣿⣿⣆⠀⠀⠀⠉⠉⠀⠀⠀⣸⣿⣿⠃⢀⣤⣾⣿⣿⠟⠁
⠀⠀⠈⠻⣿⣿⣿⣶⣿⣿⣿⣦⣄⠀⠀⠀⢀⣠⣾⣿⣿⣿⣾⣿⣿⡿⠋⠁⠀⠀
⠀⠀⠀⠀⠀⠙⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠿⠿⠿⠿⠿⠿⠛⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢰⣷⡦⠀⠀⠀⢀⣀⣀⠀⠀⠀⢴⣾⡇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣸⠟⠁⠀⠀⠀⠘⣿⡇⠀⠀⠀⠀⠙⢷⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠻⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀
`;

interface MediaUploaderProps {
  slug: string;
}

export function MediaUploader({ slug }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewOnce, setViewOnce] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedSlug, setUploadedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", slug);
      formData.append("viewOnce", viewOnce.toString());
      formData.append("mediaType", file.type.startsWith("video/") ? "video" : "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadSuccess(true);
      setUploadedSlug(data.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [slug, viewOnce]);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    let mediaFile: File | null = null;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
        const file = item.getAsFile();
        if (file) {
          mediaFile = file;
          break;
        }
      }
    }

    if (mediaFile) {
      onDrop([mediaFile]);
    }
  }, [onDrop]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/gif": [],
      "image/webp": [],
      "video/mp4": [],
      "video/webm": [],
      "video/ogg": [],
    },
    maxSize: 100 * 1024 * 1024, // 100MB for videos
    multiple: false,
  });

  const handleCopy = async () => {
    if (!uploadedSlug) return;
    const url = `${process.env.NEXT_PUBLIC_URL ?? ''}/${uploadedSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (uploadSuccess && uploadedSlug) {
    return (
      <main className="row-start-2 flex flex-col items-center w-full max-w-2xl mx-auto">
        <pre
          className="font-[family-name:var(--font-geist-mono)] text-center mb-8"
          style={{
            whiteSpace: "pre",
            fontSize: "clamp(0.35rem, 2vw, 0.6rem)",
            lineHeight: "0.8",
            letterSpacing: "-0.5px",
          }}
        >
          {UPLOAD_ASCII}
        </pre>
        <div className="w-full space-y-8 px-4">
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-900/50 rounded-full flex items-center justify-center border border-gray-800">
              <Check className="w-6 h-6 text-gray-400" />
            </div>
            <h2 className="text-xl font-[family-name:var(--font-geist-mono)]">
              UPLOAD SUCCESSFUL
            </h2>
            <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
              YOUR MEDIA HAS BEEN UPLOADED
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)] text-center">
              YOU CAN ACCESS YOUR MEDIA AT:
            </p>
            <div className="flex rounded border border-gray-800 bg-gray-900/50 group relative">
              <code className="w-full px-3 py-2 text-sm font-[family-name:var(--font-geist-mono)] text-center">
                {process.env.NEXT_PUBLIC_URL ?? ''}/{uploadedSlug}
              </code>
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-gray-800 transition-all duration-200"
              >
                <div className="relative w-4 h-4">
                  <Copy
                    className={`absolute inset-0 h-4 w-4 text-gray-400 transition-all duration-300 ${
                      copied
                        ? "transform rotate-[-90deg] scale-0 opacity-0"
                        : "transform rotate-0 scale-100 opacity-100"
                    }`}
                  />
                  <Check
                    className={`absolute inset-0 h-4 w-4 text-gray-400 transition-all duration-300 ${
                      copied
                        ? "transform rotate-0 scale-100 opacity-100"
                        : "transform rotate-[90deg] scale-0 opacity-0"
                    }`}
                  />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="row-start-2 flex flex-col items-center w-full max-w-2xl mx-auto">
      <pre 
        className="font-[family-name:var(--font-geist-mono)] text-center mb-8"
        style={{ 
          whiteSpace: "pre",
          fontSize: "clamp(0.35rem, 2vw, 0.6rem)",
          lineHeight: "0.8",
          letterSpacing: "-0.5px",
        }}
      >
        {UPLOAD_ASCII}
      </pre>

      <div className="w-full space-y-8 px-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-[family-name:var(--font-geist-mono)] text-center">UPLOAD MEDIA</h1>
          <p className="text-center text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            THIS URL IS AVAILABLE FOR YOUR MEDIA
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`mt-4 p-8 border rounded text-center transition-colors cursor-pointer ${
            isDragActive
              ? "border-gray-700 bg-gray-900/50"
              : "border-gray-800 hover:border-gray-700 hover:bg-gray-900/30"
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">UPLOADING...</p>
          ) : isDragActive ? (
            <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">DROP THE FILE HERE...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
                DRAG AND DROP A FILE HERE, CLICK TO SELECT, OR PASTE FROM CLIPBOARD
              </p>
              <p className="text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
                SUPPORTED FORMATS: JPG, PNG, GIF, WEBP, MP4, WEBM, OGV (MAX 100MB)
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 justify-center">
          <Switch
            id="view-once"
            checked={viewOnce}
            onCheckedChange={setViewOnce}
            className="bg-gray-900/50 border border-gray-800 data-[state=checked]:bg-gray-700"
          />
          <Label 
            htmlFor="view-once"
            className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)] relative h-5 flex items-center select-none"
          >
            <span className="mr-2">DELETE AFTER</span>
            <div className="relative h-5 w-24">
              <span
                className={`absolute inset-0 flex items-center transition-all duration-500 ${
                  viewOnce
                    ? "opacity-100 clip-path-morph-in"
                    : "opacity-0 clip-path-morph-out"
                }`}
              >
                FIRST VIEW
              </span>
              <span
                className={`absolute inset-0 flex items-center transition-all duration-500 ${
                  viewOnce
                    ? "opacity-0 clip-path-morph-out"
                    : "opacity-100 clip-path-morph-in"
                }`}
              >
                24 HOURS
              </span>
            </div>
          </Label>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-900/50 rounded text-center">
            <p className="text-sm text-red-400 font-[family-name:var(--font-geist-mono)]">
              {error.toUpperCase()}
            </p>
          </div>
        )}
      </div>
    </main>
  );
} 