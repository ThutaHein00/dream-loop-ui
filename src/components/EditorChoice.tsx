import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type EditorGame = {
  id: string;
  title: string;
  price: number;
  discountPercent?: number;
  discountedPrice?: number;
  rating?: number;
  downloads?: number;
  genre?: string;
  platform?: string;
  imageUrl: string;
  screenshots?: string[];
  badge?: string;
};

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  return (i + len) % len;
}

export default function EditorChoice({
  items,
  onPick,
  autoPlayMs = 6000,
  title = "Editor Choice",
}: {
  items: EditorGame[];
  onPick?: (g: EditorGame) => void;
  autoPlayMs?: number;
  title?: string;
}) {
  const PICK_TITLES = useMemo(
    () => [
      "Stardew Valley",
      "Clair Obscur: Expedition 33",
      "Super Mario Odyssey",
      "Animal Crossing: New Horizons",
      "Monument Valley",
    ],
    [],
  );

  const REASON_BY_TITLE = useMemo(
    () =>
      ({
        "Stardew Valley":
          "A cozy, endlessly replayable farm-life RPG with charming characters and satisfying progression.",
        "Clair Obscur: Expedition 33":
          "Stylish turn-based combat meets strong storytelling—perfect if you want an emotional, cinematic RPG.",
        "Super Mario Odyssey":
          "Creative sandbox platforming packed with surprises—pure fun from start to finish.",
        "Animal Crossing: New Horizons":
          "Relaxing island life with personalization, collecting, and daily rituals that feel comforting.",
        "Monument Valley":
          "A short, beautiful puzzle journey with impossible architecture and a calm, dreamy atmosphere.",
      }) as Record<string, string>,
    [],
  );

  const defaultReason =
    "One of our favorites—beautifully made, easy to enjoy, and hard to put down.";

  const reasonFor = (gameTitle: string) =>
    REASON_BY_TITLE[gameTitle] ?? defaultReason;

  const games = useMemo(() => {
    const byTitle = new Map<string, EditorGame>();
    for (const g of items) {
      if (!g) continue;
      if (!byTitle.has(g.title)) byTitle.set(g.title, g);
    }
    return PICK_TITLES.map((t) => byTitle.get(t)).filter(
      Boolean,
    ) as EditorGame[];
  }, [items, PICK_TITLES]);

  const [idx, setIdx] = useState(0);

  const safeIdx = games.length ? clampIndex(idx, games.length) : 0;
  const active = games[safeIdx];

  useEffect(() => {
    if (games.length <= 1) return;
    const t = window.setInterval(() => {
      setIdx((i) => clampIndex(i + 1, games.length));
    }, autoPlayMs);
    return () => window.clearInterval(t);
  }, [games.length, autoPlayMs]);

  if (!active) return null;

  const prev = () => setIdx((i) => clampIndex(i - 1, games.length));
  const next = () => setIdx((i) => clampIndex(i + 1, games.length));

  return (
    <section className="w-full">
      <div className="px-6 md:px-10 pt-6">
        <div className="text-white/90 text-sm font-extrabold tracking-wide uppercase">
          {title}
        </div>

        <div className="relative mt-3 rounded-3xl overflow-hidden border border-white/15 bg-black/20 shadow-lg">
          {games.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prev}
                className="hidden md:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/30 hover:bg-black/45 border border-white/10 z-20"
                aria-label="Previous"
                title="Previous"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <button
                type="button"
                onClick={next}
                className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/30 hover:bg-black/45 border border-white/10 z-20"
                aria-label="Next"
                title="Next"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => onPick?.(active)}
            className="relative w-full h-80 md:h-115 text-left"
            title={active.title}
          >
            <img
              src={active.imageUrl}
              alt={active.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/25 to-black/10" />

            <div className="relative p-6 md:p-10 max-w-190">
              <div className="inline-flex items-center rounded-full bg-white/15 border border-white/15 px-3 py-1 text-xs text-white/90">
                {active.badge ?? "Editor Choice"}
              </div>

              <div className="mt-3 text-4xl md:text-6xl font-extrabold text-black leading-tight ">
                {active.title}
              </div>

              <div className="mt-3 text-sm md:text-base text-black/85">
                {reasonFor(active.title)}
              </div>
            </div>

            {games.length > 1 ? (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-20">
                {games.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdx(i);
                    }}
                    className={[
                      "h-2 rounded-full transition",
                      i === safeIdx
                        ? "w-7 bg-white/90"
                        : "w-2 bg-white/35 hover:bg-white/55",
                    ].join(" ")}
                    aria-label={`Go to slide ${i + 1}`}
                    title={`Go to ${i + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </button>
        </div>
      </div>
    </section>
  );
}
