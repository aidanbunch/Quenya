"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as tus from "tus-js-client";
import { supabaseClient } from "@/lib/supabase-client";

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
  const hasInteracted = useRef(false);
  const uploadRef = useRef<tus.Upload | null>(null);

  const handleViewOnceChange = (checked: boolean) => {
    hasInteracted.current = true;
    setViewOnce(checked);
  };

  const createDatabaseEntry = async (file: File, publicUrl: string) => {
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          url: publicUrl,
          mimeType: file.type,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          size: file.size,
          viewOnce,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create database entry");
      }

      return data.slug;
    } catch (error) {
      console.error("Database entry error:", error);
      throw new Error("Failed to create database entry");
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      // Try to get existing session
      let { data: { session } } = await supabaseClient.auth.getSession();
      
      // If no session exists, sign in anonymously
      if (!session) {
        const { error: signInError } = await supabaseClient.auth.signInAnonymously();
        if (signInError) throw new Error(signInError.message);
        
        // Get the new session after sign in
        const { data: { session: newSession }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !newSession) throw new Error("No session found after sign in");
        session = newSession;
      }

      const fileName = `${slug}${getExtension(file.type)}`;

      return new Promise((resolve, reject) => {
        uploadRef.current = new tus.Upload(file, {
          endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: "media",
            objectName: fileName,
            contentType: file.type,
            cacheControl: "3600",
          },
          chunkSize: 6 * 1024 * 1024,
          onError: (error) => {
            console.error("Upload failed:", error);
            setError(error.message || "Upload failed");
            setIsUploading(false);
            reject(error);
          },
          onSuccess: async () => {
            try {
              const { data } = supabaseClient.storage
                .from("media")
                .getPublicUrl(fileName);

              const newSlug = await createDatabaseEntry(file, data.publicUrl);
              setUploadedSlug(newSlug);
              setUploadSuccess(true);
              resolve(newSlug);
            } catch (error) {
              reject(error);
            } finally {
              setIsUploading(false);
            }
          },
        });

        uploadRef.current.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            uploadRef.current?.resumeFromPreviousUpload(previousUploads[0]);
          }
          uploadRef.current?.start();
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      throw err;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    await handleUpload(file);
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
    maxSize: 50 * 1024 * 1024, // 50MB for videos
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
            <div className="space-y-2">
              <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
                UPLOADING
                <span className="inline-flex ml-[2px]">
                  <span className="animate-dot-1">.</span>
                  <span className="animate-dot-2">.</span>
                  <span className="animate-dot-3">.</span>
                </span>
              </p>
            </div>
          ) : isDragActive ? (
            <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
              DROP THE FILE HERE...
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
                DRAG AND DROP A FILE HERE, CLICK TO SELECT, OR PASTE FROM CLIPBOARD
              </p>
              <p className="text-xs text-gray-500 font-[family-name:var(--font-geist-mono)]">
                SUPPORTED FORMATS: JPG, PNG, GIF, WEBP, MP4, WEBM, OGV (MAX 50MB)
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 justify-center">
          <Switch
            id="view-once"
            checked={viewOnce}
            onCheckedChange={handleViewOnceChange}
            className="bg-gray-900/50 border border-gray-800 data-[state=checked]:bg-gray-700"
          />
          <Label 
            htmlFor="view-once"
            className="text-sm text-gray-400 font-[family-name:var(--font-geist-mono)] relative h-5 flex items-center select-none"
          >
            <span className="mr-2">DELETE AFTER</span>
            <div className="relative h-5 w-24">
              <span
                className={`absolute inset-0 flex items-center ${
                  !hasInteracted.current
                    ? viewOnce ? "opacity-100" : "opacity-0"
                    : `transition-all duration-500 ${
                        viewOnce
                          ? "opacity-100 clip-path-morph-in"
                          : "opacity-0 clip-path-morph-out"
                      }`
                }`}
              >
                FIRST VIEW
              </span>
              <span
                className={`absolute inset-0 flex items-center ${
                  !hasInteracted.current
                    ? viewOnce ? "opacity-0" : "opacity-100"
                    : `transition-all duration-500 ${
                        viewOnce
                          ? "opacity-0 clip-path-morph-out"
                          : "opacity-100 clip-path-morph-in"
                      }`
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