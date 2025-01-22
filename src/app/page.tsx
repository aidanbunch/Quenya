"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RING_ASCII = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣶⣶⣶⣶⣄⠀⢠⣄⡀⠀⠀⠀⠀
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

export default function Home() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (slug) {
      router.push(`/${slug}`);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6 sm:space-y-8 px-4">
        <pre
          className="font-[family-name:var(--font-geist-mono)] text-center scale-[0.85] sm:scale-100"
          style={{
            whiteSpace: "pre",
            fontSize: "clamp(0.35rem, 1.8vw, 0.6rem)",
            lineHeight: "0.8",
            letterSpacing: "-0.5px",
          }}
        >
          {RING_ASCII}
        </pre>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-geist-mono)] text-center">
            QUENYA
          </h1>
          <p className="text-center text-xs sm:text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            SHARE IMAGES THAT SELF-DESTRUCT AFTER VIEWING
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded border border-gray-800 bg-gray-900/50">
            <span className="inline-flex items-center px-3 border-r border-gray-800 text-gray-400 text-xs sm:text-sm font-[family-name:var(--font-geist-mono)]">
              {process.env.NEXT_PUBLIC_URL ?? ''}/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm font-[family-name:var(--font-geist-mono)] placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700"
              placeholder="transmission"
              pattern="[a-zA-Z0-9-_]+"
              title="Only letters, numbers, hyphens, and underscores are allowed"
            />
          </div>
        </form>

        <div className="text-center space-y-1">
          <p className="text-[10px] sm:text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
            ENTER ANY URL TO UPLOAD OR VIEW AN IMAGE
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
            THE IMAGE IS DESTROYED AFTER FIRST VIEW OR 24 HOURS
          </p>
        </div>
      </div>
    </div>
  );
}
