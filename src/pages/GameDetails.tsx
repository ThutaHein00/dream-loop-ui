import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar, { type Suggestion } from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchGames, formatDownloads, type RowGame } from "./Store";
import { getGameMeta } from "../lib/gameMeta";

const COVER_BY_KEY: Record<string, string> = {
  albaawildlifeadventure: "/AlbaAWildlifeAdventure.jpg",
  animalcrossingnewhorizons: "/AnimalCrossingNewHorizons.jpg",
  ashorthike: "/AShortHike.jpg",
  bearbreakfast: "/Bear&Breakfast.jpg",
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

type MeResponse = { email: string; role: string };

type Review = { id: number; userEmail: string; stars: number; comment: string };

function coverFallback(title: string) {
  const key = normalizeTitle(title);
  const local = COVER_BY_KEY[key];
  if (local) return local;
  const seed = encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"));
  return `https://picsum.photos/seed/${seed}/1200/700`;
}

function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/embed/"))
        return `https://www.youtube.com${u.pathname}`;

      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export default function GameDetails() {
  const nav = useNavigate();
  const { id } = useParams();

  const [me, setMe] = useState<MeResponse | null>(null);
  const isLoggedIn = Boolean(me?.email);

  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());

  const [game, setGame] = useState<RowGame | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const q = query.trim();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

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

  useEffect(() => {
    if (!wishlistKey) {
      setWishlistIds(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(wishlistKey);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      setWishlistIds(new Set(Array.isArray(arr) ? arr : []));
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
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      setCartIds(new Set(Array.isArray(arr) ? arr : []));
    } catch {
      setCartIds(new Set());
    }
  }, [cartKey]);

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

  const isWishlisted = (gid: string) => wishlistIds.has(gid);
  const toggleWishlist = (gid: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  const isInCart = (gid: string) => cartIds.has(gid);
  const addToCart = (gid: string) => {
    setCartIds((prev) => {
      const next = new Set(prev);
      next.add(gid);
      return next;
    });
  };

  const onWishlistClick = (gid: string) => {
    if (!isLoggedIn) return nav("/login");
    toggleWishlist(gid);
  };

  const onAddToCart = (gid: string) => {
    if (!isLoggedIn) return nav("/login");
    addToCart(gid);
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
      nav("/");
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const page = await fetchGames({ size: 300 });
        const list = Array.isArray(page?.content) ? page.content : [];
        const found = list.find((g) => String(g.id) === String(id));

        if (!found) {
          if (!cancelled) setGame(null);
          return;
        }

        const discount = Number(found.discountPercent ?? 0);
        const hasDiscount = discount > 0;
        const oldPrice = hasDiscount ? Number(found.price) : undefined;
        const price = hasDiscount
          ? Number(found.discountedPrice)
          : Number(found.price);

        const row: RowGame = {
          id: String(found.id),
          title: found.title,
          price,
          oldPrice,
          imageUrl: coverFallback(found.title),
          rating: Number(found.rating ?? 0),
          downloads: Number(found.downloads ?? 0),
          platform: found.platform,
          genre: found.genre,
        };

        if (!cancelled) setGame(row);
      } catch {
        if (!cancelled) setGame(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    if (!q) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const t = setTimeout(async () => {
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
          imageUrl: coverFallback(g.title),
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
      clearTimeout(t);
    };
  }, [q]);

  const onEnterSearch = () => {
    if (suggestions[0]) nav(`/game/${suggestions[0].id}`);
  };

  const meta = useMemo(
    () => (game ? getGameMeta(game.title) : undefined),
    [game]
  );
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    setAboutExpanded(false);
    setReviewStars(5);
    setReviewComment("");
  }, [game?.id]);

  const loadReviews = async (gameId: string) => {
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/reviews`, {
        credentials: "include",
      });
      if (!res.ok) {
        setReviews([]);
        return;
      }
      const data = (await res.json()) as Review[];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (!game?.id) return;
    void loadReviews(game.id);
  }, [game?.id]);

  const submitReview = async () => {
    if (!game?.id) return;
    if (!isLoggedIn) return nav("/login");

    const comment = reviewComment.trim();

    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/games/${game.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stars: reviewStars, comment }),
      });

      if (!res.ok) {
        return;
      }

      setReviewComment("");
      await loadReviews(game.id);
    } catch {
      // ignore
    } finally {
      setReviewSubmitting(false);
    }
  };

  const deleteMyReview = async () => {
    if (!game?.id) return;
    if (!isLoggedIn) return nav("/login");

    const ok = window.confirm("Delete your review?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/games/${game.id}/reviews/me`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await loadReviews(game.id);
      }
    } catch {
      // ignore
    }
  };

  const trailerUrl = meta?.trailerUrl;
  const ytEmbedBase = trailerUrl ? toYouTubeEmbed(trailerUrl) : null;
  const ytEmbed = useMemo(() => {
    if (!ytEmbedBase) return null;
    const sep = ytEmbedBase.includes("?") ? "&" : "?";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${ytEmbedBase}${sep}rel=0&modestbranding=1&playsinline=1${
      origin ? `&origin=${encodeURIComponent(origin)}` : ""
    }`;
  }, [ytEmbedBase]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        isLoggedIn={isLoggedIn}
        userEmail={me?.email ?? null}
        isAdmin={(me?.role ?? "").toUpperCase().includes("ADMIN")}
        onAdminClick={() => nav("/admin")}
        cartCount={cartIds.size}
        onSignInClick={() => nav("/login")}
        onLogoutClick={onLogout}
        tab={"Browse"}
        setTab={(t) => {
          nav(`/?tab=${encodeURIComponent(t)}`);
        }}
        query={query}
        setQuery={setQuery}
        onEnterSearch={onEnterSearch}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        onSelectSuggestion={(g) => nav(`/game/${g.id}`)}
        onHomeClick={() => nav("/")}
      />

      <main className="mx-auto max-w-7xl w-full px-4 md:px-6 pb-10 flex-1">
        {loading ? (
          <div className="mt-8 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Loading...
          </div>
        ) : !game ? (
          <div className="mt-8 rounded-2xl bg-white border border-black/10 p-6 text-neutral-700">
            Game not found.{" "}
            <button className="btn btn-link" onClick={() => nav("/")}>
              Go back
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold text-neutral-900 truncate">
                  {game.title}
                </h1>
                <div className="mt-2 text-sm text-neutral-600">
                  {game.platform ?? "Games"}{" "}
                  {game.genre ? (
                    <span className="opacity-70">• {game.genre}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onWishlistClick(game.id)}
                  className="btn btn-sm rounded-xl bg-white border border-black/10 hover:bg-black/5"
                >
                  <span
                    className={
                      isWishlisted(game.id) ? "text-[#E60012]" : "text-black/50"
                    }
                  >
                    {isWishlisted(game.id) ? "❤" : "♡"}
                  </span>
                  <span className="ml-2 font-bold">Wishlist</span>
                </button>

                <button
                  type="button"
                  onClick={() => nav(-1)}
                  className="btn btn-sm rounded-xl bg-white border border-black/10 hover:bg-black/5"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2">
                <div className="rounded-2xl border border-black/10 overflow-hidden bg-white shadow-sm">
                  {ytEmbed ? (
                    <iframe
                      className="w-full h-85 md:h-105"
                      src={ytEmbed}
                      title={`${game.title} trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : trailerUrl ? (
                    <video
                      controls
                      className="w-full h-85 md:h-105 object-cover"
                      src={trailerUrl}
                    />
                  ) : (
                    <iframe
                      className="w-full h-85 md:h-105"
                      src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                        `${game.title} trailer`
                      )}`}
                      title={`${game.title} trailer search`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}
                </div>
              </section>

              <aside className="lg:col-span-1">
                <div className="rounded-2xl border border-black/10 bg-white shadow-sm p-5">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-extrabold text-neutral-900">
                      ${game.price.toFixed(2)}
                    </div>
                    {game.oldPrice ? (
                      <div className="text-sm line-through text-neutral-400">
                        ${game.oldPrice.toFixed(2)}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 text-sm text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">Rating</span>
                      <span className="font-bold">
                        ⭐ {game.rating.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="opacity-70">Downloads</span>
                      <span className="font-bold">
                        {formatDownloads(game.downloads)}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-black/10 pt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Developer</span>
                        <span className="font-semibold">
                          {meta?.developer ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Publisher</span>
                        <span className="font-semibold">
                          {meta?.publisher ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Release</span>
                        <span className="font-semibold">
                          {meta?.releaseDate ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="opacity-70">Reviews</span>
                        <span className="font-semibold">
                          {meta?.reviewSummary ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isInCart(game.id)) {
                        nav("/cart");
                        return;
                      }
                      onAddToCart(game.id);
                    }}
                    className="mt-5 btn w-full rounded-xl bg-[#E60012] hover:bg-[#c40010] border-none text-white font-extrabold"
                    title={
                      !isLoggedIn
                        ? "Login required"
                        : isInCart(game.id)
                        ? "Already in cart"
                        : "Add to cart"
                    }
                  >
                    {!isLoggedIn
                      ? "Login to add to cart"
                      : isInCart(game.id)
                      ? "In Cart"
                      : "Add to Cart"}
                  </button>

                  {!isLoggedIn ? (
                    <div className="mt-2 text-xs text-neutral-500">
                      Guest users can't add to cart.
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-neutral-500">
                      You can only add one of each game.
                    </div>
                  )}
                </div>
              </aside>
            </div>

            <section className="mt-10">
              <h2 className="text-xl font-extrabold text-neutral-900">
                About this game
              </h2>
              <div className="mt-3 rounded-2xl border border-black/10 bg-white p-5">
                <div className="whitespace-pre-line text-neutral-800 leading-relaxed">
                  {aboutExpanded
                    ? meta?.aboutLong ??
                      meta?.aboutShort ??
                      "No description yet."
                    : meta?.aboutShort ?? "No description yet."}
                </div>

                {meta?.aboutLong ? (
                  <button
                    type="button"
                    className="mt-4 btn btn-sm rounded-xl bg-white border border-black/10 hover:bg-black/5"
                    onClick={() => setAboutExpanded((v) => !v)}
                  >
                    {aboutExpanded ? "See less" : "See more"}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-extrabold text-neutral-900">
                  Reviews
                </h2>
                {!isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => nav("/login")}
                    className="btn btn-sm rounded-xl bg-white border border-black/10 hover:bg-black/5"
                  >
                    Login to write a review
                  </button>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <div className="text-sm font-bold text-neutral-900">
                    Write a review
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-neutral-500 mb-2">
                      Your rating
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const v = i + 1;
                        const active = v <= reviewStars;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setReviewStars(v)}
                            disabled={!isLoggedIn || reviewSubmitting}
                            className={[
                              "h-9 w-9 rounded-xl grid place-items-center border",
                              active
                                ? "border-[#E60012] bg-red-50"
                                : "border-black/10 bg-white",
                              !isLoggedIn
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-black/5",
                            ].join(" ")}
                            aria-label={`${v} star`}
                            title={`${v} star`}
                          >
                            <span
                              className={
                                active ? "text-[#E60012]" : "text-black/30"
                              }
                            >
                              ★
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs text-neutral-500 mb-2">
                      Your comment
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      disabled={!isLoggedIn || reviewSubmitting}
                      className="textarea textarea-bordered w-full rounded-2xl min-h-27.5"
                      placeholder={
                        isLoggedIn
                          ? "Write something helpful (optional)"
                          : "Login required"
                      }
                      maxLength={2000}
                    />
                    <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between">
                      <span>{reviewComment.length}/2000</span>
                      <span className="opacity-70">You can edit later.</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={!isLoggedIn || reviewSubmitting}
                    className="mt-4 btn w-full rounded-xl bg-[#E60012] hover:bg-[#c40010] border-none text-white font-extrabold"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit review"}
                  </button>

                  {isLoggedIn ? (
                    <button
                      type="button"
                      onClick={deleteMyReview}
                      className="mt-2 btn w-full rounded-xl bg-white border border-black/10 hover:bg-red-50 text-red-700 font-bold"
                    >
                      Delete my review
                    </button>
                  ) : (
                    <div className="mt-2 text-xs text-neutral-500">
                      Guest users can't submit reviews.
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                    {reviewLoading ? (
                      <div className="text-sm text-neutral-600">
                        Loading reviews...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-sm text-neutral-600">
                        No reviews yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-2xl border border-black/10 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-neutral-900 truncate">
                                  {r.userEmail}
                                </div>
                                <div className="mt-1 text-sm">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={
                                        i < r.stars
                                          ? "text-[#E60012]"
                                          : "text-black/20"
                                      }
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {me?.email && r.userEmail === me.email ? (
                                <span className="text-xs font-bold text-[#E60012]">
                                  You
                                </span>
                              ) : null}
                            </div>

                            {r.comment ? (
                              <div className="mt-3 text-sm text-neutral-800 whitespace-pre-line">
                                {r.comment}
                              </div>
                            ) : (
                              <div className="mt-3 text-sm text-neutral-500 italic">
                                (No comment)
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
