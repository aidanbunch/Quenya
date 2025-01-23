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

interface ImageUploaderProps {
  slug: string;
}

export function ImageUploader({ slug }: ImageUploaderProps) {
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

    let imageFile: File | null = null;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFile = file;
          break;
        }
      }
    }

    if (imageFile) {
      onDrop([imageFile]);
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
    },
    maxSize: 10 * 1024 * 1024, // 10MB
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
              YOUR IMAGE HAS BEEN UPLOADED
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)] text-center">
              YOU CAN ACCESS YOUR IMAGE AT:
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
          <h1 className="text-2xl font-[family-name:var(--font-geist-mono)] text-center">UPLOAD AN IMAGE</h1>
          <p className="text-center text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            THIS URL IS AVAILABLE FOR YOUR IMAGE
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
            <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">DROP THE IMAGE HERE...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
                DRAG AND DROP AN IMAGE HERE, CLICK TO SELECT, OR PASTE FROM CLIPBOARD
              </p>
              <p className="text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
                SUPPORTED FORMATS: JPG, PNG, GIF, WEBP (MAX 10MB)
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
            className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]"
          >
            DELETE AFTER FIRST VIEW (OR AFTER 24 HOURS)
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