"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Search as SearchIcon,
  Sidebar,
  X,
} from "lucide-react";
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
  HighlightLayer,
  Thumbnail,
  Thumbnails,
  CurrentPage,
  Search,
  calculateHighlightRects,
  SearchResult,
  usePdf,
  usePdfJump,
  useSearch,
} from "@unriddle-ai/lector";
import { GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { useDebounce } from "use-debounce";

// Set up the worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const VIEW_ASCII = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣶⣶⣶⣶⣄⠀⢠⣄⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣾⣿⣿⡿⠛⢻⣿⣿⣿⠀⢀⣿⣿⣦⡀⠀⠀
⠀⠀⠀⠀⠀⠀⣠⣴⣿⣿⣿⠋⠉⠁⠀⣸⣿⣿⡏⠀⢸⣿⣿⣿⣷⡄⠀
⠀⠀⠀⠀⢀⣾⣿⣿⠋⠁⠉⠀⣰⣶⣾⣿⡿⠟⠀⢠⣿⣿⣿⣿⣿⣿⡄
⠀⠀⠀⣴⣿⣿⠟⠛⠀⠀⣿⣿⣿⡿⠛⠉⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⡇
⠀⢀⣾⣿⣿⠿⠀⠀⣶⣾⣿⡿⠋⠀⠀⠀⠀⣰⣿⣿⣿⡟⠉⢻⣿⣿⣿⠇
⠀⣾⣿⡏⠀⢀⣀⣴⣿⡿⠋⠀⠀⠀⠀⣠⣾⣿⣿⠋⠁⠀⠀⢀⣿⣿⡟⠀
⢸⣿⣿⣧⣀⣼⣿⣿⡟⠁⠀⠀⠀⣠⣾⣿⣿⠛⠛⠀⠀⣾⣿⣿⡟⠀⠀
⠸⣿⣿⣿⣿⣿⡿⠏⠀⠀⢀⣠⣾⣿⡿⠿⠿⠀⢠⣤⣾⣿⣿⠟⠀⠀⠀
⠀⠈⠉⠉⠁⠀⢀⣀⣤⣾⣿⣿⠿⠿⠃⠀⣀⣠⣾⣿⣿⡿⠃⠀⠀⠀⠀
⠀⠳⣶⣶⣶⣿⣿⣿⣿⣿⣿⣏⠀⢀⣀⣠⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣾⣿⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠙⢻⣿⣿⣿⣿⣿⣿⣿⠿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

interface PDFViewerProps {
  slug: string;
  initialData: {
    url: string;
    mimeType: string;
    viewOnce: boolean;
    expiresAt: string;
  };
  className?: string;
}

interface ResultItemProps {
  result: SearchResult;
}

const ResultItem = ({ result }: ResultItemProps) => {
  const { jumpToHighlightRects } = usePdfJump();
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);

  const onClick = async () => {
    const pageProxy = getPdfPageProxy(result.pageNumber);
    const rects = await calculateHighlightRects(pageProxy, {
      pageNumber: result.pageNumber,
      text: result.text,
      matchIndex: result.matchIndex,
    });
    jumpToHighlightRects(rects, "pixels");
  };

  return (
    <div
      className="flex py-2 hover:bg-gray-800/50 flex-col cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 font-[family-name:var(--font-geist-mono)]">{result.text}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span className="ml-auto font-[family-name:var(--font-geist-mono)]">Page {result.pageNumber}</span>
      </div>
    </div>
  );
};

interface ResultGroupProps {
  results: SearchResult[];
  displayCount?: number;
}

const ResultGroup = ({ results, displayCount }: ResultGroupProps) => {
  if (!results.length) return null;

  const displayResults = displayCount
    ? results.slice(0, displayCount)
    : results;

  return (
    <div className="divide-y divide-gray-800">
      {displayResults.map((result) => (
        <ResultItem
          key={`${result.pageNumber}-${result.matchIndex}`}
          result={result}
        />
      ))}
    </div>
  );
};

interface SearchResponse {
  exactMatches: SearchResult[];
  fuzzyMatches: SearchResult[];
  hasMoreResults: boolean;
}

const SearchUI = ({ onClose }: { onClose: () => void }) => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 300);
  const [limit, setLimit] = useState(5);
  const { search } = useSearch();
  const [searching, setSearching] = useState(false);
  const [localResults, setLocalResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchText.trim()) {
        setLimit(5);
        setSearching(true);
        try {
          const searchResult = await search(debouncedSearchText, { limit: 5 }) as SearchResponse;
          const combinedResults = [
            ...searchResult.exactMatches,
            ...searchResult.fuzzyMatches
          ];
          setLocalResults(combinedResults);
        } catch {
          setLocalResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setLocalResults([]);
      }
    };
    
    performSearch();
  }, [debouncedSearchText, search]);

  const handleLoadMore = async () => {
    const newLimit = limit + 5;
    setSearching(true);
    try {
      const moreResults = await search(debouncedSearchText, { limit: newLimit }) as SearchResponse;
      const combinedResults = [
        ...moreResults.exactMatches,
        ...moreResults.fuzzyMatches
      ];
      setLocalResults(combinedResults);
      setLimit(newLimit);
    } catch {
      // Keep existing results on error
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-64 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-lg overflow-hidden shadow-xl">
      <div className="p-2 border-b border-gray-800 flex items-center gap-2">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="SEARCH IN DOCUMENT..."
          className="flex-1 bg-gray-900/50 border border-gray-800 rounded px-2 py-1 text-xs text-gray-400 font-[family-name:var(--font-geist-mono)] focus:outline-none focus:ring-1 focus:ring-gray-700"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-gray-800"
          onClick={() => {
            setSearchText("");
            setLocalResults([]);
            onClose();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {searching ? (
          <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)] text-center py-2">
            SEARCHING...
          </p>
        ) : localResults?.length > 0 ? (
          <>
            <ResultGroup results={localResults} displayCount={limit} />
            {localResults.length > limit && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-xs font-[family-name:var(--font-geist-mono)] text-gray-400 hover:bg-gray-800"
                onClick={handleLoadMore}
              >
                LOAD MORE RESULTS
              </Button>
            )}
          </>
        ) : debouncedSearchText ? (
          <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)] text-center py-2">
            NO RESULTS FOUND
          </p>
        ) : null}
      </div>
    </div>
  );
};

export function PDFViewer({ slug, initialData, className }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const handleDownload = async () => {
    try {
      const response = await fetch(initialData.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quenya-${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("DOWNLOAD FAILED. PLEASE TRY AGAIN.");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <Root
      source={initialData.url}
      className={cn("row-start-2 flex flex-col w-full max-w-5xl mx-auto h-[calc(100vh-20rem)]", className)}
      loader={
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex space-x-4">
            <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
          </div>
        </div>
      }
    >
      <Search>
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

        <div className="flex flex-col h-full space-y-4">
          {initialData.viewOnce && (
            <div className="px-4">
              <div className="p-2 border border-yellow-900/50 bg-yellow-900/20 rounded text-center">
                <p className="text-xs text-yellow-400 font-[family-name:var(--font-geist-mono)]">
                  WARNING: THIS PDF WILL BE DELETED AFTER VIEWING
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="px-4">
              <div className="p-2 border border-red-900/50 bg-red-900/20 rounded text-center">
                <p className="text-xs text-red-400 font-[family-name:var(--font-geist-mono)]">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div 
            ref={containerRef}
            className="flex-1 relative bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
          >
            {/* Top Controls */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-20 p-0.5 rounded-lg bg-gray-900/80 backdrop-blur border border-gray-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowThumbnails(prev => !prev)}
                className="h-7 w-7 hover:bg-gray-800"
              >
                <Sidebar className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(prev => !prev)}
                className="h-7 w-7 hover:bg-gray-800"
              >
                <SearchIcon className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-gray-800" />
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
                onClick={handleZoomIn}
                className="h-7 w-7 hover:bg-gray-800"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-gray-800" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-7 w-7 hover:bg-gray-800"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-7 w-7 hover:bg-gray-800"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Panel */}
            {showSearch && (
              <div className="absolute top-12 right-2 z-20">
                <SearchUI onClose={() => setShowSearch(false)} />
              </div>
            )}

            <div className={cn(
              "grid h-full transition-all duration-500 ease-in-out",
              showThumbnails ? "grid-cols-[16rem,1fr]" : "grid-cols-[0,1fr]"
            )}>
              {/* Thumbnails */}
              <div className={cn(
                "overflow-y-auto bg-gray-900/30 border-r border-gray-800 transition-all duration-500 ease-in-out transform",
                showThumbnails 
                  ? "w-64 opacity-100 translate-x-0" 
                  : "w-0 opacity-0 -translate-x-full"
              )}>
                <Thumbnails className="p-4 space-y-4">
                  <Thumbnail 
                    className="w-full border border-gray-800 rounded-lg hover:border-gray-700 hover:shadow-lg transition-all duration-200" 
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </Thumbnails>
              </div>

              {/* PDF Content */}
              <div className="relative overflow-auto">
                <Pages className="p-4">
                  <Page>
                    <CanvasLayer style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} />
                    <TextLayer 
                      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                      className="select-text"
                    />
                    <HighlightLayer 
                      className="bg-yellow-500/30"
                      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                    />
                  </Page>
                </Pages>

                {/* Bottom Controls */}
                <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/80 backdrop-blur border border-gray-800">
                      <span className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">PAGE</span>
                      <div className="w-px h-4 bg-gray-800" />
                      <CurrentPage 
                        className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)] min-w-[2rem] text-center bg-transparent pointer-events-none select-none" 
                        style={{ 
                          WebkitAppearance: "none",
                          MozAppearance: "textfield"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center px-4 pb-4">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
              THIS PDF WILL BE DELETED{" "}
              {initialData.viewOnce ? "AFTER VIEWING" : "IN 24 HOURS"}
            </p>
          </div>
        </div>
      </Search>
    </Root>
  );
} 