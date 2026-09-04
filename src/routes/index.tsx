import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { PanoViewer } from "@/components/pano-viewer";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback((message: string) => setError(message), []);

  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      <PanoViewer onReady={onReady} onError={onError} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center p-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:p-8">
        <h1 className="flex flex-nowrap items-baseline justify-center gap-x-4 font-display leading-[0.7] text-fg sm:gap-x-6 [text-shadow:0_2px_18px_rgb(0_0_0_/_0.55)]">
          <span className="flex items-baseline leading-none">
            <span className="text-6xl sm:text-8xl">a</span>
            <span className="text-4xl sm:text-7xl">telier</span>
          </span>
          <span className="flex items-baseline leading-none">
            <span className="text-6xl sm:text-8xl">k</span>
            <span className="text-4xl sm:text-7xl">haos</span>
          </span>
        </h1>
        <p className="-mt-1 text-center font-display text-2xl leading-none text-black sm:-mt-2 sm:text-4xl [text-shadow:0_1px_0_rgb(241_235_227_/_0.45)]">
          panorama 360
        </p>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-8">
        <p className="max-w-sm font-sans text-sm text-muted">
          {error
            ? error
            : ready
              ? "Glisser pour regarder · pincer ou molette pour zoomer"
              : "Chargement des faces du cube…"}
        </p>
      </div>
    </main>
  );
}
