"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Download, ZoomIn, ZoomOut, Maximize2, RotateCw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEW_ASCII = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠰⢶⣶⣿⣷⣮⣄⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣤⣾⣿⣶⣦⠘⠿⠛⠙⠁⣿⣿⠈⢛⣿⣦⣀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⣠⣿⣿⠟⠈⠹⣿⣇⠀⠀⢀⣴⣿⡟⠰⣿⠋⢉⣿⢻⣦⣀⠀⠀⠀⠀
⠀⠀⠀⠸⠁⠹⠏⠀⠀⠀⣿⡯⣠⣾⡿⠟⠃⠀⢀⣹⣷⠿⠋⠈⠹⣿⣦⠀⠀⠀
⠀⢰⢠⣤⣶⣶⣤⣤⡀⢠⣿⣿⡿⠋⠠⣶⣿⣿⣿⣿⣿⣿⣶⣤⡀⠈⢿⣷⡀⠀
⢠⣿⣿⡟⠉⠉⠛⢿⣿⣾⣿⣿⠃⠀⠀⠘⣿⣿⠿⠿⡟⠛⢿⣿⣿⣷⡌⢻⣧⠀
⢸⣿⣏⠀⠀⠀⠀⡀⢹⣿⣿⣿⣷⣤⣄⣴⣿⠟⠃⠀⢠⣶⣦⡉⠈⢿⣿⣆⢿⡇
⠛⡅⠛⠀⠀⣼⣿⣿⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣿⣿⣿⣿⡄⠸⣿⣿⡎⣷
⢰⡇⢀⣠⣄⡀⠙⣿⣆⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠉⢻⣿⠘
⠸⣧⡟⠉⠙⢷⡆⣿⠹⣦⣀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢿⣿⣷⠀⣸⣿⠀
⠀⢻⣇⡀⢀⣼⡟⠀⠀⠈⠙⠿⣿⣿⠃⣿⣿⣿⣿⣿⣿⣿⡏⢸⣿⣿⠀⢻⡿⠀
⠀⠈⣿⡋⠛⠉⠀⠀⢤⣷⡀⠀⠘⠁⠀⠘⣿⣿⠏⣿⣿⣿⡆⠘⣿⡿⠀⣸⠃⠀
⠀⠀⠈⢷⣄⠀⠀⠀⠛⠛⢿⣶⠦⠤⢶⣾⠿⢿⢃⣿⣿⡿⢀⣼⣿⠃⡰⠃⠀⠀
⠀⠀⠀⠀⠻⣦⣄⠀⠀⠀⠀⠷⠀⠀⠀⠀⠀⣠⣾⣿⠟⠀⢹⡿⢃⠞⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠈⠙⠿⢶⣤⣤⣤⣤⣤⣤⣶⡿⠿⠋⣡⣤⡶⠋⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠛⠉⢛⣃⣉⣠⠤⠾⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

interface ImageData {
  url: string;
  mimeType: string;
  viewOnce: boolean;
  expiresAt: string;
}

interface ImageViewerProps {
  slug: string;
  initialData: ImageData;
  className?: string;
}

export function ImageViewer({ slug, initialData, className }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventBrowserZoom = (e: WheelEvent) => {
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const isInBounds = 
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInBounds && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY * -0.01;
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
      }
    };

    // Prevent zoom on keyboard shortcuts
    const preventZoomKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', preventBrowserZoom, { passive: false });
    window.addEventListener('keydown', preventZoomKeys);

    return () => {
      window.removeEventListener('wheel', preventBrowserZoom);
      window.removeEventListener('keydown', preventZoomKeys);
    };
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleDownload = async () => {
    try {
      const response = await fetch(initialData.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quenya-${slug}${getExtension(initialData.mimeType)}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("DOWNLOAD FAILED. PLEASE TRY AGAIN.");
    }
  };

  const getExtension = (mimeType: string) => {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
    };
    return extensions[mimeType] || "";
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <main className={cn("row-start-2 flex flex-col items-center w-full max-w-5xl mx-auto h-full", className)}>
      <pre 
        className="font-[family-name:var(--font-geist-mono)] text-center mb-4"
        style={{ 
          whiteSpace: "pre",
          fontSize: "clamp(0.25rem, 1.5vw, 0.5rem)",
          lineHeight: "0.8",
          letterSpacing: "-0.5px",
        }}
      >
        {VIEW_ASCII}
      </pre>

      <div className="w-full space-y-4 px-4">
        {initialData.viewOnce && (
          <div className="p-2 border border-yellow-900/50 bg-yellow-900/20 rounded text-center">
            <p className="text-xs text-yellow-400 font-[family-name:var(--font-geist-mono)]">
              WARNING: THIS IMAGE WILL BE DELETED AFTER VIEWING
            </p>
          </div>
        )}

        {error && (
          <div className="p-2 border border-red-900/50 bg-red-900/20 rounded text-center">
            <p className="text-xs text-red-400 font-[family-name:var(--font-geist-mono)]">
              {error}
            </p>
          </div>
        )}

        <div 
          ref={containerRef}
          className="relative bg-gray-900/50 border border-gray-800 rounded overflow-hidden group aspect-[16/9]"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-20 p-0.5 rounded bg-gray-900/80 backdrop-blur border border-gray-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-7 w-7 hover:bg-gray-800"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-7 w-7 hover:bg-gray-800"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="h-7 w-7 hover:bg-gray-800"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-7 w-7 hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-7 w-7 hover:bg-gray-800"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-7 w-7 hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Container */}
          <div 
            ref={imageRef}
            className="relative w-full h-full transition-all duration-200 ease-out"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {loading && (
                <div className="animate-pulse flex space-x-4">
                  <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                </div>
              )}
              <Image
                src={initialData.url}
                alt="Shared image"
                fill
                className={cn(
                  "object-contain transition-opacity duration-300",
                  loading ? "opacity-0" : "opacity-100"
                )}
                quality={100}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError("FAILED TO LOAD IMAGE");
                  setLoading(false);
                }}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
            THIS IMAGE WILL BE DELETED{" "}
            {initialData.viewOnce ? "AFTER VIEWING" : "IN 24 HOURS"}
          </p>
        </div>
      </div>
    </main>
  );
} 