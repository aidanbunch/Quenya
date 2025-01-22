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
        {RING_ASCII}
      </pre>

      <div className="w-full space-y-8 px-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-[family-name:var(--font-geist-mono)] text-center">
            QUENYA
          </h1>
          <p className="text-center text-sm text-gray-400 font-[family-name:var(--font-geist-mono)]">
            SHARE IMAGES THAT SELF-DESTRUCT AFTER VIEWING
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded border border-gray-800 bg-gray-900/50">
            <span className="inline-flex items-center px-3 border-r border-gray-800 text-gray-400 text-sm font-[family-name:var(--font-geist-mono)]">
              {typeof window !== "undefined"
                ? window.location.origin + "/"
                : "/"}
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm font-[family-name:var(--font-geist-mono)] placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-700"
              placeholder="your-custom-url"
              pattern="[a-zA-Z0-9-_]+"
              title="Only letters, numbers, hyphens, and underscores are allowed"
            />
          </div>
        </form>

        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
            ENTER ANY URL TO UPLOAD OR VIEW AN IMAGE
          </p>
          <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
            THE IMAGE IS DESTROYED AFTER FIRST VIEW OR 24 HOURS
          </p>
        </div>
      </div>
    </main>
  );
}
