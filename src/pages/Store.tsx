import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { pageTransition } from "../animations/pageTransition";
import Navbar, { type StoreTab, type Suggestion } from "../components/Navbar";
import EditorChoice, { type EditorGame } from "../components/EditorChoice";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";

type GameResponse = {
  id: number;
  title: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  rating: number;
  downloads: number;
  genre: string;
  platform: string;
  trailerUrl?: string;
};

type PageResponse<T> = { content: T[] };
type MeResponse = { email: string; role: string };

export type RowGame = {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  rating: number;
  downloads: number;
  platform?: string;
  genre?: string;
};

type SortKey = "TOP_SELLERS" | "RATING" | "PRICE";
type SortDir = "DESC" | "ASC";

const COVER_BY_KEY: Record<string, string> = {
  albaawildlifeadventure: "/AlbaAWildlifeAdventure.jpg",
  animalcrossingnewhorizons: "/AnimalCrossingNewHorizons.jpg",
  ashorthike: "/AShortHike.jpg",
  bearandbreakfast: "/Bear&Breakfast.jpg",
  celeste: "/Celeste.jpg",
  clairobscurexpedition33: "/ClairObscurExpedition33.jpg",
  cozygrove: "/CozyGrove.jpg",
  factorio: "/Factorio.jpg",
  gris: "/GRIS.jpg",
  houseflipper: "/HouseFlipper.jpg",
  journey: "/Journey.jpg",
  littlewood: "/Littlewood.jpg",
  monumentvalley: "/MonumentValley.jpg",
  moonlighter: "/MoonLighter.jpg",
  octopathtraveler: "/OctopathTraveler.jpg",
  slimerancher: "/SlimeRancher.jpg",
  spiritfarer: "/Spiritfarer.jpg",
  stardewvalley: "/StardewValley.jpg",
  subnautica: "/SubNautica.jpg",
  supermarioodyssey: "/SuperMarioOdyssey.jpg",
  thewanderingvillage: "/TheWanderingVillage.jpg",
};

const normalizeTitle = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function coverForTitle(title: string) {
  const key = normalizeTitle(title);
  const local = COVER_BY_KEY[key];
  if (local) return local;
  const seed = encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"));
  return `https://picsum.photos/seed/${seed}/900/600`;
}

function toRowGame(g: GameResponse): RowGame {
  const discount = Number(g.discountPercent ?? 0);
  const hasDiscount = discount > 0;

  const oldPrice = hasDiscount ? Number(g.price) : undefined;
  const price = hasDiscount ? Number(g.discountedPrice) : Number(g.price);

  return {
    id: String(g.id),
    title: g.title,
    price,
    oldPrice,
    imageUrl: coverForTitle(g.title),
    rating: Number(g.rating ?? 0),
    downloads: Number(g.downloads ?? 0),
    platform: g.platform,
    genre: g.genre,
  };
}

export async function fetchGames(params: {
  q?: string;
  page?: number;
  size?: number;
}) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  usp.set("page", String(params.page ?? 0));
  usp.set("size", String(params.size ?? 300));

  const res = await fetch(`/api/games?${usp.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as PageResponse<GameResponse>;
}

export function formatDownloads(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function BrowseGamesRow({
  items,
  onSeeAll,
  onWishlistClick,
  isWishlisted,
  onOpenGame,
}: {
  items: RowGame[];
  onSeeAll: () => void;
  onWishlistClick: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  onOpenGame: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < max - 2);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scrollByCards = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const gap = 20;
    const cardW = (card?.offsetWidth ?? 300) + gap;
    const amount = cardW * 2;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const ArrowPaddle = ({
    side,
    show,
    onClick,
  }: {
    side: "left" | "right";
    show: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={[
        "absolute top-0 z-10 h-full",
        side === "left" ? "left-0 rounded-l-2xl" : "right-0 rounded-r-2xl",
        "w-8 md:w-10",
        "bg-transparent",
        "transition-all duration-200",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
        "hover:bg-white/70 hover:backdrop-blur-sm hover:border hover:border-black/20 hover:shadow-md",
        "group flex items-center justify-center cursor-pointer",
      ].join(" ")}
    >
      <span className="select-none leading-none font-black text-5xl md:text-6xl text-black/60 group-hover:text-black group-hover:scale-110 transition-transform duration-200">
        {side === "left" ? "‹" : "›"}
      </span>
    </button>
  );

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-extrabold text-neutral-900">
          Browse Games
        </h2>
      </div>

      <div className="mt-4 relative">
        <ArrowPaddle
          side="left"
          show={canLeft}
          onClick={() => scrollByCards("left")}
        />
        <ArrowPaddle
          side="right"
          show={canRight}
          onClick={() => scrollByCards("right")}
        />

        <div className="-mx-4 md:-mx-6 px-4 md:px-6">
          <div
            ref={scrollerRef}
            className="flex gap-5 overflow-x-auto pb-3 pr-6 scroll-smooth px-9 md:px-11 hide-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`
              .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            {items.map((g) => (
              <article
                key={g.id}
                data-card
                onClick={() => onOpenGame(g.id)}
                className="
                  group shrink-0 w-75 cursor-pointer
                  rounded-2xl bg-white border border-black/10
                  shadow-sm overflow-hidden
                  transition-transform duration-200 ease-out
                  hover:-translate-y-1 hover:scale-[1.02]
                  hover:shadow-xl hover:border-black/20
                "
              >
                <img
                  src={g.imageUrl}
                  alt={g.title}
                  className="
                    h-47.5 w-full object-cover
                    transition-transform duration-300 ease-out
                    group-hover:scale-[1.04]
                  "
                  loading="lazy"
                />

                <div className="p-4">
                  <div className="font-bold text-[15px] leading-snug text-black">
                    <span className="block truncate text-black">{g.title}</span>
                  </div>

                  <div className="mt-2 text-xs text-neutral-500">
                    {g.platform ? g.platform : "Games"}
                    {g.genre ? (
                      <span className="opacity-70"> • {g.genre}</span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div className="text-lg font-extrabold text-neutral-900">
                      ${g.price.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWishlistClick(g.id);
                      }}
                      className="
                        h-10 w-10 rounded-full border border-black/10
                        grid place-items-center transition
                        hover:scale-110 hover:bg-black/5 active:scale-95
                      "
                      aria-label="Toggle wishlist"
                      title="Wishlist"
                    >
                      <span
                        className={[
                          "text-xl leading-none transition",
                          isWishlisted(g.id)
                            ? "text-[#E60012]"
                            : "text-black/40 hover:text-[#E60012]",
                        ].join(" ")}
                      >
                        {isWishlisted(g.id) ? "❤" : "♡"}
                      </span>
                    </button>
                  </div>

                  {g.oldPrice ? (
                    <div className="mt-2 text-sm text-neutral-400 line-through">
                      ${g.oldPrice.toFixed(2)}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}

            <button
              onClick={onSeeAll}
              className="shrink-0 w-27.5 md:w-30 rounded-2xl bg-[#E60012] hover:bg-[#9f000e] text-white font-extrabold grid place-items-center"
              type="button"
            >
              See all
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GridCard({
  g,
  onOpen,
  onWishlistClick,
  isWishlisted,
}: {
  g: RowGame;
  onOpen: (id: string) => void;
  onWishlistClick: (id: string) => void;
  isWishlisted: (id: string) => boolean;
}) {
  return (
    <div
      onClick={() => onOpen(g.id)}
      className="
        group cursor-pointer rounded-2xl bg-white border border-black/10 overflow-hidden
        shadow-sm transition-transform duration-200 ease-out
        hover:-translate-y-1 hover:scale-[1.02]
        hover:shadow-xl hover:border-black/20
      "
    >
      <img
        src={g.imageUrl}
        alt={g.title}
        className="
          h-44 w-full object-cover
          transition-transform duration-300 ease-out
          group-hover:scale-[1.04]
        "
        loading="lazy"
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold truncate">{g.title}</div>

            <div className="mt-1 text-xs text-neutral-600 flex items-center gap-2">
              <span className="font-semibold">⭐ {g.rating.toFixed(2)}</span>
              <span className="opacity-70">•</span>
              <span>{formatDownloads(g.downloads)} downloads</span>
            </div>

            <div className="mt-1 text-xs text-neutral-500">
              {g.platform ? g.platform : "Games"}
              {g.genre ? (
                <span className="opacity-70"> • {g.genre}</span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWishlistClick(g.id);
            }}
            className="h-9 w-9 rounded-full border border-black/10 grid place-items-center transition hover:scale-110 hover:bg-black/5 active:scale-95"
            aria-label="Toggle wishlist"
            title="Wishlist"
          >
            <span
              className={
                isWishlisted(g.id)
                  ? "text-[#E60012] text-lg"
                  : "text-black/40 text-lg hover:text-[#E60012]"
              }
            >
              {isWishlisted(g.id) ? "❤" : "♡"}
            </span>
          </button>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="font-extrabold text-[#111] text-lg">
            ${g.price.toFixed(2)}
          </div>
          {g.oldPrice ? (
            <div className="text-sm line-through text-neutral-400">
              ${g.oldPrice.toFixed(2)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function readTabFromUrl(search: string): StoreTab | null {
  const usp = new URLSearchParams(search);
  const t = usp.get("tab");
  if (t === "Browse" || t === "Deals" || t === "Wishlist" || t === "Cart")
    return t;
  return null;
}

export default function Store({
  initialTab = "Browse",
}: {
  initialTab?: StoreTab;
}) {
  const nav = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState<StoreTab>(
    () => readTabFromUrl(location.search) ?? initialTab
  );

  const [query, setQuery] = useState("");

  const [me, setMe] = useState<MeResponse | null>(null);
  const isLoggedIn = Boolean(me?.email);

  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

  const [pageGames, setPageGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [browseExpanded, setBrowseExpanded] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("TOP_SELLERS");
  const [sortDir, setSortDir] = useState<SortDir>("DESC");
  const [visibleCount, setVisibleCount] = useState(21);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const browseRef = useRef<HTMLDivElement | null>(null);

  const q = query.trim();

  useEffect(() => {
    const t = readTabFromUrl(location.search);
    if (t) setTab(t);
  }, [location.search]);

  useEffect(() => {
    const urlTab = readTabFromUrl(location.search);
    if (!urlTab) setTab(initialTab);
  }, [initialTab, location.search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/me`, { credentials: "include" });
        if (!res.ok) throw new Error("not logged in");
        const data = (await res.json()) as MeResponse;
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const wishlistKey = me?.email ? `wishlist:${me.email}` : null;
  const cartKey = me?.email ? `cart:${me.email}` : null;
  const ownedKey = me?.email ? `owned:${me.email}` : null;

  useEffect(() => {
    if (!wishlistKey) {
      setWishlistIds(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(wishlistKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? (parsed as string[]) : [];
      setWishlistIds(new Set(arr));
    } catch {
      setWishlistIds(new Set());
    }
  }, [wishlistKey]);

  useEffect(() => {
    if (!cartKey) {
      setCartIds(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(cartKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? (parsed as string[]) : [];
      setCartIds(new Set(arr));
    } catch {
      setCartIds(new Set());
    }
  }, [cartKey]);

  useEffect(() => {
    if (!ownedKey) {
      setOwnedIds(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(ownedKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(parsed) ? (parsed as string[]) : [];
      setOwnedIds(new Set(arr));
    } catch {
      setOwnedIds(new Set());
    }
  }, [ownedKey]);

  useEffect(() => {
    if (!wishlistKey) return;
    try {
      localStorage.setItem(
        wishlistKey,
        JSON.stringify(Array.from(wishlistIds))
      );
    } catch {
      // ignore
    }
  }, [wishlistIds, wishlistKey]);

  useEffect(() => {
    if (!cartKey) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(Array.from(cartIds)));
    } catch {
      // ignore
    }
  }, [cartIds, cartKey]);

  useEffect(() => {
    if (!ownedKey) return;
    try {
      localStorage.setItem(ownedKey, JSON.stringify(Array.from(ownedIds)));
    } catch {
      // ignore
    }
  }, [ownedIds, ownedKey]);

  useEffect(() => {
    if (!ownedKey) return;
    try {
      localStorage.setItem(ownedKey, JSON.stringify(Array.from(ownedIds)));
    } catch {
      // ignore
    }
  }, [ownedIds, ownedKey]);

  const isWishlisted = (id: string) => wishlistIds.has(id);

  const toggleWishlist = (id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeFromCart = (id: string) => {
    setCartIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const onWishlistClick = (id: string) => {
    if (!isLoggedIn) {
      nav("/login");
      return;
    }
    toggleWishlist(id);
  };

  const onLogout = async () => {
    try {
      await fetch(`/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      setMe(null);
      setWishlistIds(new Set());
      setCartIds(new Set());
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const page = await fetchGames({ size: 300 });
        const list = Array.isArray(page?.content) ? page.content : [];
        if (!cancelled) setPageGames(list);
      } catch {
        if (!cancelled) setError("Failed to load games from backend.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!q) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const page = await fetchGames({ q, size: 6 });
        const list = Array.isArray(page?.content) ? page.content : [];
        const sug: Suggestion[] = list.map((g) => ({
          id: String(g.id),
          title: g.title,
          price:
            Number(g.discountPercent ?? 0) > 0
              ? Number(g.discountedPrice)
              : Number(g.price),
          imageUrl: coverForTitle(g.title),
          discountPercent: Number(g.discountPercent ?? 0),
        }));
        if (!cancelled) setSuggestions(sug);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  const rows = useMemo(() => pageGames.map(toRowGame), [pageGames]);

  const editorChoiceItems: EditorGame[] = useMemo(() => {
    const titles = [
      "Stardew Valley",
      "Clair Obscur: Expedition 33",
      "Super Mario Odyssey",
      "Animal Crossing: New Horizons",
      "Monument Valley",
    ] as const;

    const byTitle = new Map<string, RowGame>();
    for (const r of rows) byTitle.set(r.title, r);

    const fallback = (title: string): EditorGame => ({
      id: "",
      title,
      price: 0,
      discountPercent: 0,
      discountedPrice: 0,
      rating: 0,
      downloads: 0,
      genre: undefined,
      platform: undefined,
      imageUrl: coverForTitle(title),
      badge: "Editor Choice",
    });

    return titles.map((t) => {
      const r = byTitle.get(t);
      if (!r) return fallback(t);

      const discountPercent =
        r.oldPrice && r.oldPrice > 0
          ? Math.max(1, Math.round(((r.oldPrice - r.price) / r.oldPrice) * 100))
          : 0;

      return {
        id: r.id,
        title: r.title,
        price: r.price,
        discountPercent,
        discountedPrice: r.price,
        rating: r.rating,
        downloads: r.downloads,
        genre: r.genre,
        platform: r.platform,
        imageUrl: r.imageUrl,
        badge: "Editor Choice",
      };
    });
  }, [rows]);

  const dealsOnly = useMemo(
    () => rows.filter((g) => (g.oldPrice ?? 0) > 0),
    [rows]
  );
  const browsePreview = useMemo(() => rows.slice(0, 4), [rows]);

  const onEnterSearch = () => {
    if (suggestions[0]) {
      nav(`/game/${suggestions[0].id}`);
      return;
    }
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onHomeClick = () => {
    nav("/?tab=Browse", { replace: true });
    setTab("Browse");
    setQuery("");
    setBrowseExpanded(false);
    setSortKey("TOP_SELLERS");
    setSortDir("DESC");
    setVisibleCount(21);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSeeAll = () => {
    setBrowseExpanded(true);
    setVisibleCount(21);
    window.setTimeout(() => {
      browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const browseSorted = useMemo(() => {
    const list = [...rows];
    const getDownloads = (g: RowGame) => g.downloads ?? 0;
    const getRating = (g: RowGame) => g.rating ?? 0;
    const getPrice = (g: RowGame) => g.price ?? 0;

    list.sort((a, b) => {
      if (sortKey === "TOP_SELLERS") return getDownloads(b) - getDownloads(a);
      if (sortKey === "RATING") return getRating(b) - getRating(a);
      return getPrice(a) - getPrice(b);
    });

    if (sortKey === "PRICE") {
      if (sortDir === "DESC") list.reverse();
    } else {
      if (sortDir === "ASC") list.reverse();
    }

    return list;
  }, [rows, sortKey, sortDir]);

  const browseVisible = useMemo(
    () => browseSorted.slice(0, visibleCount),
    [browseSorted, visibleCount]
  );

  const wishlistGames = useMemo(
    () => rows.filter((g) => wishlistIds.has(g.id)),
    [rows, wishlistIds]
  );

  const cartGames = useMemo(
    () => rows.filter((g) => cartIds.has(g.id)),
    [rows, cartIds]
  );

  const sortBtnBase =
    "btn btn-sm rounded-full transition font-semibold shadow-sm px-4";
  const sortBtnInactive =
    "bg-white text-[#111] border border-black/20 hover:bg-black/5 hover:border-black/30";
  const sortBtnActive =
    "bg-[#E60012] text-white border border-[#E60012] hover:bg-[#c40010] shadow-md font-bold";

  const openGame = (id: string) => {
    if (!id || !/^\d+$/.test(id)) return;
    nav(`/game/${id}`);
  };

  const setTabAndUrl = (t: StoreTab) => {
    nav(`/?tab=${encodeURIComponent(t)}`, { replace: true });
    setTab(t);
    if (t !== "Browse") setBrowseExpanded(false);
  };

  return (
    <motion.div
      className="min-h-screen bg-white flex flex-col"
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      <Navbar
        isLoggedIn={isLoggedIn}
        userEmail={me?.email ?? null}
        isAdmin={(me?.role ?? "").toUpperCase().includes("ADMIN")}
        onAdminClick={() => nav("/admin")}
        cartCount={cartIds.size}
        onSignInClick={() => nav("/login")}
        onLogoutClick={onLogout}
        tab={tab}
        setTab={setTabAndUrl}
        query={query}
        setQuery={setQuery}
        onEnterSearch={onEnterSearch}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        onSelectSuggestion={(g) => nav(`/game/${g.id}`)}
        onHomeClick={onHomeClick}
      />

      <main className="mx-auto max-w-7xl w-full px-4 md:px-6 pb-10 flex-1">
        {tab === "Browse" || tab === "Deals" ? (
          <EditorChoice
            items={editorChoiceItems}
            onPick={(g) => openGame(g.id)}
            title="Editor Choice"
          />
        ) : null}
        <div ref={resultsRef} className="pt-2" />

        {loading && (
          <div className="mt-8 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Loading games...
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl bg-white border border-black/10 p-6 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === "Browse" && (
              <>
                {!browseExpanded && (
                  <BrowseGamesRow
                    items={browsePreview}
                    onSeeAll={onSeeAll}
                    onWishlistClick={onWishlistClick}
                    isWishlisted={isWishlisted}
                    onOpenGame={openGame}
                  />
                )}

                {browseExpanded && (
                  <section ref={browseRef} className="mt-10">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-extrabold text-neutral-900">
                          Browse games
                        </h2>
                        <p className="text-neutral-600 mt-1">
                          Explore cozy favorites and new releases.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-neutral-50 border border-black/10 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-neutral-600">
                          Showing result of{" "}
                          <span className="font-bold">
                            {browseVisible.length}
                          </span>{" "}
                          games
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-sm text-neutral-600 mr-1">
                            Sort by:
                          </span>

                          <button
                            className={[
                              sortBtnBase,
                              sortKey === "TOP_SELLERS"
                                ? sortBtnActive
                                : sortBtnInactive,
                            ].join(" ")}
                            onClick={() => {
                              setSortKey("TOP_SELLERS");
                              setSortDir("DESC");
                              setVisibleCount(21);
                            }}
                          >
                            Top Sellers
                          </button>

                          <button
                            className={[
                              sortBtnBase,
                              sortKey === "RATING"
                                ? sortBtnActive
                                : sortBtnInactive,
                            ].join(" ")}
                            onClick={() => {
                              if (sortKey !== "RATING") {
                                setSortKey("RATING");
                                setSortDir("DESC");
                              } else {
                                setSortDir((d) =>
                                  d === "DESC" ? "ASC" : "DESC"
                                );
                              }
                              setVisibleCount(21);
                            }}
                            title="Toggle rating direction"
                          >
                            Rating{" "}
                            {sortKey === "RATING" ? (
                              <span className="ml-1 opacity-90">
                                {sortDir === "DESC" ? "↓" : "↑"}
                              </span>
                            ) : null}
                          </button>

                          <button
                            className={[
                              sortBtnBase,
                              sortKey === "PRICE"
                                ? sortBtnActive
                                : sortBtnInactive,
                            ].join(" ")}
                            onClick={() => {
                              if (sortKey !== "PRICE") {
                                setSortKey("PRICE");
                                setSortDir("ASC");
                              } else {
                                setSortDir((d) =>
                                  d === "ASC" ? "DESC" : "ASC"
                                );
                              }
                              setVisibleCount(21);
                            }}
                            title="Toggle price direction"
                          >
                            Price{" "}
                            {sortKey === "PRICE" ? (
                              <span className="ml-1 opacity-90">
                                {sortDir === "ASC" ? "↑" : "↓"}
                              </span>
                            ) : null}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {browseVisible.map((g) => (
                        <GridCard
                          key={g.id}
                          g={g}
                          onOpen={openGame}
                          onWishlistClick={onWishlistClick}
                          isWishlisted={isWishlisted}
                        />
                      ))}
                    </div>

                    {visibleCount < browseSorted.length ? (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleCount((n) =>
                              Math.min(n + 21, browseSorted.length)
                            )
                          }
                          className="btn rounded-xl bg-white border border-black/10 hover:bg-black/5 font-bold"
                        >
                          Load more
                        </button>
                      </div>
                    ) : null}
                  </section>
                )}
              </>
            )}

            {tab === "Deals" && (
              <section className="mt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-neutral-900">
                      Top Deals
                    </h2>
                    <p className="text-neutral-600 mt-1">
                      All discounted games in one place.
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600">
                    Showing{" "}
                    <span className="font-bold">{dealsOnly.length}</span> deals
                  </div>
                </div>

                {dealsOnly.length ? (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {dealsOnly.map((g) => (
                      <GridCard
                        key={g.id}
                        g={g}
                        onOpen={openGame}
                        onWishlistClick={onWishlistClick}
                        isWishlisted={isWishlisted}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
                    No discounted games right now.
                  </div>
                )}
              </section>
            )}

            {tab === "Wishlist" && (
              <section className="mt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-neutral-900">
                      Wishlist
                    </h2>
                    <p className="text-neutral-600 mt-1">
                      Games you saved for later.
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {isLoggedIn ? (
                      <>
                        <span className="font-bold">
                          {wishlistGames.length}
                        </span>{" "}
                        items
                      </>
                    ) : (
                      "Login required"
                    )}
                  </div>
                </div>

                {!isLoggedIn ? (
                  <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
                    Please log in to view your wishlist.
                  </div>
                ) : wishlistGames.length ? (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wishlistGames.map((g) => (
                      <GridCard
                        key={g.id}
                        g={g}
                        onOpen={openGame}
                        onWishlistClick={onWishlistClick}
                        isWishlisted={isWishlisted}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
                    Your wishlist is empty.
                  </div>
                )}
              </section>
            )}

            {tab === "Cart" && (
              <section className="mt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-neutral-900">
                      Cart
                    </h2>
                    <p className="text-neutral-600 mt-1">
                      Games ready to purchase.
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {isLoggedIn ? (
                      <>
                        <span className="font-bold">{cartGames.length}</span>{" "}
                        items
                      </>
                    ) : (
                      "Login required"
                    )}
                  </div>
                </div>

                {!isLoggedIn ? (
                  <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
                    Please log in to view your cart.
                  </div>
                ) : cartGames.length ? (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cartGames.map((g) => (
                      <div key={g.id} className="relative">
                        <GridCard
                          g={g}
                          onOpen={openGame}
                          onWishlistClick={onWishlistClick}
                          isWishlisted={isWishlisted}
                        />

                        {ownedIds.has(g.id) ? (
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            disabled
                            className="absolute top-3 left-3 rounded-full bg-white/90 border border-black/10 px-3 py-1 text-xs font-extrabold text-neutral-500 cursor-not-allowed"
                            title="Already owned"
                          >
                            Owned
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              nav(`/checkout/${g.id}`);
                            }}
                            className="absolute top-3 left-3 rounded-full bg-white/90 border border-black/10 px-3 py-1 text-xs font-extrabold hover:bg-white"
                          >
                            Buy
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(g.id);
                          }}
                          className="absolute top-3 right-3 rounded-full bg-white/90 border border-black/10 px-3 py-1 text-xs font-bold hover:bg-white"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
                    Your cart is empty.
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </motion.div>
  );
}
