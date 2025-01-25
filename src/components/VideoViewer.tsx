"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn, getFileExtension } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Maximize2,
  RotateCw,
  RefreshCw,
  Rewind,
  FastForward,
} from "lucide-react";

const VIEW_ASCII = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣶⣶⣶⣶⣄⠀⢠⣄⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣾⣿⣿⡿⠛⢻⣿⣿⣿⠀⢀⣿⣿⣦⡀⠀⠀
⠀⠀⠀⠀⠀⠀⣠⣴⣿⣿⣿⠋⠉⠁⠀⣸⣿⣿⡏⠀⢸⣿⣿⣿⣷⡄⠀
⠀⠀⠀⠀⢀⣾⣿⣿⠋⠁⠉⠀⣰⣶⣾⣿⡿⠟⠀⢠⣿⣿⣿⣿⣿⣿⡄
⠀⠀⠀⣴⣿⣿⠟⠛⠀⠀⣿⣿⣿⡿⠛⠉⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⡇
⠀⢀⣾⣿⣿⠿⠀⠀⣶⣾⣿⡿⠋⠀⠀⠀⠀⣰⣿⣿⡟⠉⢻⣿⣿⣿⠇
⠀⣾⣿⡏⠀⢀⣀⣴⣿⡿⠋⠀⠀⠀⠀⣠⣾⣿⣿⠋⠁⠀⢀⣿⣿⡟⠀
⢸⣿⣿⣧⣀⣼⣿⣿⡟⠁⠀⠀⠀⣠⣾⣿⣿⠛⠛⠀⠀⣾⣿⣿⡟⠀⠀
⠸⣿⣿⣿⣿⣿⡿⠏⠀⠀⢀⣠⣾⣿⡿⠿⠿⠀⢠⣤⣾⣿⣿⠟⠀⠀⠀
⠀⠈⠉⠉⠁⠀⢀⣀⣤⣾⣿⣿⠿⠿⠃⠀⣀⣠⣾⣿⣿⡿⠃⠀⠀⠀⠀
⠀⠳⣶⣶⣶⣿⣿⣿⣿⣿⣿⣏⠀⢀⣀⣠⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣾⣿⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠙⢻⣿⣿⣿⣿⣿⣿⣿⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

interface VideoViewerProps {
  slug: string;
  initialData: {
    url: string;
    mimeType: string;
    viewOnce: boolean;
    expiresAt: string;
  };
  className?: string;
}

export function VideoViewer({ slug, initialData, className }: VideoViewerProps) {
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, videoRef.current.duration);
    }
  }, []);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        skipBackward();
      } else if (e.key === 'ArrowRight') {
        skipForward();
      } else if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, skipBackward, skipForward]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !videoRef.current.duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * videoRef.current.duration;
    if (Number.isFinite(newTime)) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || !videoRef.current.duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pos * videoRef.current.duration;
    if (Number.isFinite(time)) {
      setSeekTime(time);
      setPreviewTime(time);
      if (previewRef.current) {
        previewRef.current.currentTime = time;
      }
    }
  };

  const handleProgressMouseLeave = () => {
    setSeekTime(null);
    setPreviewTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(initialData.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quenya-${slug}${getFileExtension(initialData.mimeType)}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("DOWNLOAD FAILED. PLEASE TRY AGAIN.");
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking controls
    if (
      e.target instanceof Element && 
      (e.target.closest('button') || e.target.closest('.progress-bar'))
    ) {
      return;
    }
    handlePlayPause();
  };

  useEffect(() => {
    // Disable default video controls and styling
    const video = videoRef.current;
    if (video) {
      video.style.pointerEvents = 'none'; // Prevent default video interactions
      video.disableRemotePlayback = true; // Disable remote playback UI
      // Force disable default controls even if they get re-enabled somehow
      const forceDisableControls = () => {
        if (video.hasAttribute('controls')) {
          video.removeAttribute('controls');
        }
      };
      video.addEventListener('loadedmetadata', forceDisableControls);
      return () => {
        video.removeEventListener('loadedmetadata', forceDisableControls);
      };
    }
  }, []);

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
              WARNING: THIS VIDEO WILL BE DELETED AFTER VIEWING
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
          className="relative bg-gray-900/50 border border-gray-800 rounded overflow-hidden group aspect-video cursor-pointer"
          onClick={handleContainerClick}
          onMouseEnter={() => {
            console.log('Container mouse enter');
            setShowControls(true);
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            console.log('Container mouse leave');
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
            handleProgressMouseLeave();
          }}
          onMouseMove={() => {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
          }}
        >
          {/* Play Overlay */}
          {!isPlaying && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-200">
              <div className="w-16 h-16 rounded-full bg-gray-900/80 border border-gray-800 flex items-center justify-center transition-transform hover:scale-110">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          )}

          {/* Top Controls */}
          <div className={cn(
            "absolute top-2 right-2 flex items-center gap-1 z-20 transition-all duration-300",
            showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            // Only show background when controls are visible
            showControls && "p-0.5 rounded bg-gray-900/80 backdrop-blur border border-gray-800"
          )}>
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
              onClick={handleDownload}
              className="h-7 w-7 hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Video Container */}
          <div 
            className="relative w-full h-full transition-all duration-200 ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse flex space-x-4">
                  <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              src={initialData.url}
              className={cn(
                "w-full h-full transition-opacity duration-300 [&::-webkit-media-controls-panel]:hidden [&::-webkit-media-controls-play-button]:hidden [&::-webkit-media-controls-timeline]:hidden [&::-webkit-media-controls-current-time-display]:hidden [&::-webkit-media-controls-time-remaining-display]:hidden [&::-webkit-media-controls-mute-button]:hidden [&::-webkit-media-controls-toggle-closed-captions-button]:hidden [&::-webkit-media-controls-volume-slider]:hidden [&::-webkit-media-controls-fullscreen-button]:hidden",
                loading ? "opacity-0" : "opacity-100"
              )}
              controls={false}
              controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
              disablePictureInPicture
              onLoadedData={() => {
                console.log('Video loaded');
                setLoading(false);
              }}
              onError={() => {
                console.error('Video load error');
                setError("FAILED TO LOAD VIDEO");
                setLoading(false);
              }}
              playsInline
            />
            {/* Hidden preview video */}
            <video
              ref={previewRef}
              src={initialData.url}
              className="hidden [&::-webkit-media-controls-panel]:hidden [&::-webkit-media-controls-play-button]:hidden [&::-webkit-media-controls-timeline]:hidden [&::-webkit-media-controls-current-time-display]:hidden [&::-webkit-media-controls-time-remaining-display]:hidden [&::-webkit-media-controls-mute-button]:hidden [&::-webkit-media-controls-toggle-closed-captions-button]:hidden [&::-webkit-media-controls-volume-slider]:hidden [&::-webkit-media-controls-fullscreen-button]:hidden"
              preload="auto"
              controls={false}
              controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
              disablePictureInPicture
              playsInline
            />
          </div>

          {/* Bottom Controls */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 transition-all duration-300",
            showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <div className="space-y-2">
              {/* Preview Thumbnail */}
              {previewTime !== null && (
                <div 
                  className="absolute bottom-20 bg-gray-900/80 backdrop-blur border border-gray-800 rounded overflow-hidden"
                  style={{ 
                    left: `${Math.max(0, Math.min(100, (previewTime / duration) * 100))}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="w-32 aspect-video">
                    <canvas 
                      className="w-full h-full"
                      ref={el => {
                        if (el && previewRef.current) {
                          const ctx = el.getContext('2d');
                          ctx?.drawImage(previewRef.current, 0, 0, el.width, el.height);
                        }
                      }}
                    />
                  </div>
                  <div className="text-center p-1 text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
                    {formatTime(previewTime)}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div 
                ref={progressRef}
                className="progress-bar relative py-3 cursor-pointer group"
                onClick={(e) => {
                  console.log('Progress bar click');
                  handleProgressClick(e);
                }}
                onMouseMove={(e) => {
                  console.log('Progress bar mouse move');
                  handleProgressMouseMove(e);
                }}
                onMouseLeave={() => {
                  console.log('Progress bar mouse leave');
                  handleProgressMouseLeave();
                }}
              >
                <div className="relative h-1">
                  {/* Background */}
                  <div className="absolute inset-0 bg-gray-800 rounded" />
                  
                  {/* Played Progress */}
                  <div 
                    className="absolute inset-0 bg-gray-400 rounded transition-all duration-150"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  {/* Seek Preview */}
                  {seekTime !== null && (
                    <div 
                      className="absolute inset-0 bg-gray-400/20 rounded"
                      style={{ width: `${(seekTime / duration) * 100}%` }}
                    />
                  )}
                  {/* Scrubber */}
                  <div 
                    className="absolute h-3 w-3 bg-gray-400 rounded-full -translate-y-1 -translate-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipBackward}
                    className="h-7 w-7 hover:bg-gray-800"
                  >
                    <Rewind className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayPause}
                    className="h-7 w-7 hover:bg-gray-800"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipForward}
                    className="h-7 w-7 hover:bg-gray-800"
                  >
                    <FastForward className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMuteToggle}
                    className="h-7 w-7 hover:bg-gray-800"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-7 w-7 hover:bg-gray-800"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
            THIS VIDEO WILL BE DELETED{" "}
            {initialData.viewOnce ? "AFTER VIEWING" : "IN 24 HOURS"}
          </p>
        </div>
      </div>
    </main>
  );
} 