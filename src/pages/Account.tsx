import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar, { type Suggestion } from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../auth/useAuth";
import { fetchGames } from "./Store";

type Tab = "Email" | "Password" | "Payment";

type NoticeKind = "info" | "success" | "error";

type PaymentMethod = {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

function paymentLSKey(email: string) {
  return `payment:${email}`;
}

function maskCard(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  const last4 = digits.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

function parseExpiry(expiry: string) {
  const cleaned = expiry.trim();
  const m = cleaned.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
  if (!m) return null;

  const mm = Number(m[1]);
  let yy = Number(m[2]);

  if (Number.isNaN(mm) || Number.isNaN(yy)) return null;
  if (yy >= 1000) yy = yy % 100;
  if (mm < 1 || mm > 12) return null;

  return { expMonth: mm, expYear: yy };
}

export default function Account() {
  const nav = useNavigate();
  const location = useLocation();
  const { me, logout, deleteAccount } = useAuth();
  const isLoggedIn = Boolean(me?.email);

  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("info");

  const [query, setQuery] = useState("");
  const q = query.trim();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const cartCount = useMemo(() => {
    if (!me?.email) return 0;
    try {
      const raw = localStorage.getItem(`cart:${me.email}`);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  }, [me?.email]);

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
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(
            g.title
          )}/120/120`,
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

  const [tab, setTab] = useState<Tab>("Email");

  useEffect(() => {
    const usp = new URLSearchParams(location.search);
    const t = usp.get("tab");
    if (t === "Email" || t === "Password" || t === "Payment") {
      setTab(t);
    }
  }, [location.search]);

  const [newEmail, setNewEmail] = useState("");
  useEffect(() => {
    setNewEmail(me?.email ?? "");
  }, [me?.email]);

  const submitEmail = async () => {
    if (!isLoggedIn) return nav("/", { replace: true });

    const next = newEmail.trim();
    if (!next || !next.includes("@")) {
      setNoticeKind("error");
      setNotice("Please enter a valid email.");
      return;
    }

    try {
      setNotice("");
      const res = await fetch("/api/auth/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: next }),
      });

      if (!res.ok) {
        setNoticeKind("error");
        setNotice("Could not change email.");
        return;
      }

      setNoticeKind("success");
      setNotice("Email updated. Please login again.");
      await logout();
      nav("/", { replace: true });
    } catch {
      setNoticeKind("error");
      setNotice("Could not change email.");
    }
  };

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const submitPassword = async () => {
    if (!isLoggedIn) return nav("/", { replace: true });

    if (newPw.trim().length < 6) {
      setNoticeKind("error");
      setNotice("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setNoticeKind("error");
      setNotice("Passwords do not match.");
      return;
    }

    try {
      setNotice("");
      const res = await fetch("/api/auth/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });

      if (!res.ok) {
        setNoticeKind("error");
        setNotice("Current password is incorrect.");
        return;
      }

      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setNoticeKind("success");
      setNotice("Password updated.");
    } catch {
      setNoticeKind("error");
      setNotice("Could not update password.");
    }
  };

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>({
    cardholder: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const [paymentSaved, setPaymentSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setPaymentSaved(false);
      if (!me?.email || tab !== "Payment") return;

      try {
        setPaymentLoading(true);
        const res = await fetch("/api/payment-method", {
          credentials: "include",
        });

        const data = res.ok ? await res.json().catch(() => null) : null;
        if (cancelled) return;

        if (data) {
          const mm = String(data.expMonth ?? "").padStart(2, "0");
          const yy = String(data.expYear ?? "").padStart(2, "0");
          setPayment({
            cardholder: data.cardholderName ?? "",
            cardNumber: data.last4 ? `**** **** **** ${data.last4}` : "",
            expiry: mm && yy ? `${mm}/${yy}` : "",
            cvc: "",
          });

          try {
            localStorage.setItem(
              paymentLSKey(me.email),
              JSON.stringify({
                cardholderName: data.cardholderName ?? "",
                last4: data.last4 ?? "",
                expMonth: data.expMonth ?? 0,
                expYear: data.expYear ?? 0,
                brand: data.brand ?? null,
              })
            );
          } catch {
            // ignore
          }
        } else {
          try {
            const raw = localStorage.getItem(paymentLSKey(me.email));
            const ls = raw ? (JSON.parse(raw) as any) : null;
            if (ls?.last4 || ls?.cardholderName) {
              const mm = String(ls.expMonth ?? "").padStart(2, "0");
              const yy = String(ls.expYear ?? "").padStart(2, "0");
              setPayment({
                cardholder: ls.cardholderName ?? "",
                cardNumber: ls.last4 ? `**** **** **** ${ls.last4}` : "",
                expiry: mm && yy ? `${mm}/${yy}` : "",
                cvc: "",
              });
            }
          } catch {
            // ignore
          }
        }
      } finally {
        if (!cancelled) setPaymentLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [me?.email, tab]);

  const submitPayment = async () => {
    setPaymentSaved(false);

    if (!me?.email) {
      setNoticeKind("error");
      setNotice("Please login to save a payment method.");
      return;
    }

    const exp = parseExpiry(payment.expiry);
    if (!exp) {
      setNoticeKind("error");
      setNotice("Please enter a valid expiry (MM/YY).");
      return;
    }

    const digits = payment.cardNumber.replace(/\D/g, "");
    const isMasked = payment.cardNumber.includes("*") && digits.length === 4;

    if (isMasked) {
      setNoticeKind("error");
      setNotice("Please re-enter the full card number to save.");
      return;
    }
    if (digits.length < 12) {
      setNoticeKind("error");
      setNotice("Please enter a valid card number.");
      return;
    }

    if (payment.cardholder.trim().length < 2) {
      setNoticeKind("error");
      setNotice("Please enter cardholder name.");
      return;
    }

    try {
      setNotice("");
      setPaymentLoading(true);

      const res = await fetch("/api/payment-method", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardholderName: payment.cardholder.trim(),
          cardNumber: payment.cardNumber,
          expMonth: exp.expMonth,
          expYear: exp.expYear,
          brand: null,
        }),
      });

      if (!res.ok) throw new Error();

      const saved = await res.json().catch(() => null);
      if (saved?.last4) {
        setPayment((p) => ({
          ...p,
          cardNumber: `**** **** **** ${saved.last4}`,
          cvc: "",
        }));
      } else {
        setPayment((p) => ({ ...p, cvc: "" }));
      }

      if (saved && me?.email) {
        try {
          localStorage.setItem(paymentLSKey(me.email), JSON.stringify(saved));
        } catch {
          // ignore
        }
      }

      setPaymentSaved(true);
      setNoticeKind("success");
      setNotice("Payment method saved.");
    } catch {
      setNoticeKind("error");
      setNotice("Could not save payment method.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar
          isLoggedIn={false}
          userEmail={null}
          isAdmin={false}
          cartCount={0}
          onSignInClick={() => nav("/login")}
          tab={"Browse"}
          setTab={(t) => nav(t === "Cart" ? "/?tab=Cart" : "/")}
          query={query}
          setQuery={setQuery}
          onEnterSearch={onEnterSearch}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          onSelectSuggestion={(g) => nav(`/game/${g.id}`)}
          onHomeClick={() => nav("/")}
        />

        <main className="mx-auto max-w-4xl w-full px-4 md:px-6 pb-10 flex-1">
          {notice ? (
            <div
              className={[
                "mt-6 rounded-2xl border p-4 text-sm",
                noticeKind === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : noticeKind === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800",
              ].join(" ")}
            >
              {notice}
            </div>
          ) : null}

          <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="text-xl font-extrabold text-neutral-900">
              Account settings
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              You need to login to view this page.
            </div>
            <button
              type="button"
              onClick={() => nav("/login")}
              className="mt-4 btn rounded-xl bg-[#E60012] hover:bg-[#c40010] border-none text-white font-extrabold"
            >
              Login
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const tabBtn = (t: Tab) =>
    [
      "btn btn-sm rounded-full border-none transition",
      t === tab
        ? "bg-[#E60012] text-white shadow"
        : "bg-black/5 hover:bg-black/10 text-neutral-900",
    ].join(" ");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        isLoggedIn
        userEmail={me?.email ?? null}
        isAdmin={(me?.role ?? "").toUpperCase().includes("ADMIN")}
        onAdminClick={() => nav("/admin")}
        cartCount={cartCount}
        onSignInClick={() => nav("/login")}
        onLogoutClick={() => logout().then(() => nav("/", { replace: true }))}
        tab={"Browse"}
        setTab={(t) => nav(t === "Cart" ? "/?tab=Cart" : "/")}
        query={query}
        setQuery={setQuery}
        onEnterSearch={onEnterSearch}
        suggestions={suggestions}
        suggestionsLoading={suggestionsLoading}
        onSelectSuggestion={(g) => nav(`/game/${g.id}`)}
        onHomeClick={() => nav("/")}
      />

      <main className="mx-auto max-w-5xl w-full px-4 md:px-6 pb-10 flex-1">
        {notice ? (
          <div
            className={[
              "mt-6 rounded-2xl border p-4 text-sm",
              noticeKind === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : noticeKind === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800",
            ].join(" ")}
          >
            {notice}
          </div>
        ) : null}

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900">
              Account settings
            </h1>
            <div className="mt-1 text-sm text-neutral-600">
              Manage your account details and payment method.
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const ok = window.confirm(
                "Delete your account permanently?\n\nThis cannot be undone."
              );
              if (!ok) return;

              try {
                await deleteAccount();
                nav("/", { replace: true });
              } catch {
                setNoticeKind("error");
                setNotice("Could not delete account.");
              }
            }}
            className="btn btn-sm rounded-xl bg-white border border-black/10 hover:bg-red-50 text-red-700"
          >
            Delete account
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["Email", "Password", "Payment"] as Tab[]).map((t) => (
            <button key={t} className={tabBtn(t)} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-black/10 bg-white shadow-sm p-6">
            {tab === "Email" ? (
              <div>
                <div className="text-lg font-extrabold text-neutral-900">
                  Email
                </div>
                <div className="mt-2 text-sm text-neutral-600">
                  This is the email linked to your account.
                </div>

                <div className="mt-5">
                  <label className="text-xs text-neutral-500 font-semibold">
                    Email address
                  </label>
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="input input-bordered w-full mt-2 rounded-2xl"
                  />
                  <div className="mt-2 text-xs text-neutral-500">
                    Changing email will log you out for security.
                  </div>

                  <button
                    type="button"
                    onClick={submitEmail}
                    className="mt-4 btn rounded-xl bg-[#E60012] hover:bg-[#c40010] border-none text-white font-extrabold"
                  >
                    Save email
                  </button>
                </div>
              </div>
            ) : null}

            {tab === "Password" ? (
              <div>
                <div className="text-lg font-extrabold text-neutral-900">
                  Password
                </div>
                <div className="mt-2 text-sm text-neutral-600">
                  Update your password.
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 font-semibold">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="input input-bordered w-full mt-2 rounded-2xl"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-500 font-semibold">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="input input-bordered w-full mt-2 rounded-2xl"
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-500 font-semibold">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="input input-bordered w-full mt-2 rounded-2xl"
                      placeholder="Repeat new password"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={submitPassword}
                    className="btn rounded-xl bg-[#E60012] hover:bg-[#c40010] border-none text-white font-extrabold"
                  >
                    Save password
                  </button>
                </div>
              </div>
            ) : null}

            {tab === "Payment" ? (
              <div>
                <div className="text-lg font-extrabold text-neutral-900">
                  Payment method
                </div>
                <div className="mt-2 text-sm text-neutral-600">
                  Saved via backend endpoint.
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 font-semibold">
                      Cardholder name
                    </label>
                    <input
                      value={payment.cardholder}
                      onChange={(e) =>
                        setPayment((p) => ({
                          ...p,
                          cardholder: e.target.value,
                        }))
                      }
                      className="input input-bordered w-full mt-2 rounded-2xl"
                      placeholder="John Doe"
                      disabled={paymentLoading}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-500 font-semibold">
                      Card number
                    </label>
                    <input
                      value={payment.cardNumber}
                      onChange={(e) =>
                        setPayment((p) => ({
                          ...p,
                          cardNumber: e.target.value,
                        }))
                      }
                      className="input input-bordered w-full mt-2 rounded-2xl"
                      placeholder="1234 5678 9012 3456"
                      disabled={paymentLoading}
                    />
                    <div className="mt-2 text-xs text-neutral-500">
                      If it shows **** **** **** 1234, it’s already saved.
                      Replace it to change the card.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-neutral-500 font-semibold">
                        Expiry (MM/YY)
                      </label>
                      <input
                        value={payment.expiry}
                        onChange={(e) =>
                          setPayment((p) => ({
                            ...p,
                            expiry: e.target.value,
                          }))
                        }
                        className="input input-bordered w-full mt-2 rounded-2xl"
                        placeholder="08/28"
                        disabled={paymentLoading}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 font-semibold">
                        CVC
                      </label>
                      <input
                        value={payment.cvc}
                        onChange={(e) =>
                          setPayment((p) => ({
                            ...p,
                            cvc: e.target.value,
                          }))
                        }
                        className="input input-bordered w-full mt-2 rounded-2xl"
                        placeholder="123"
                        disabled={paymentLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitPayment}
                    disabled={paymentLoading}
                    className="btn rounded-xl bg-[#E60012] hover:bg-[#c40010] border-none text-white font-extrabold disabled:opacity-60"
                  >
                    {paymentLoading ? "Saving..." : "Save payment method"}
                  </button>

                  {paymentSaved ? (
                    <div className="text-sm text-green-700 font-semibold">
                      Saved.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-1 rounded-2xl border border-black/10 bg-white shadow-sm p-6">
            <div className="text-sm font-bold text-neutral-900">Summary</div>
            <div className="mt-3 text-sm text-neutral-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="opacity-70">Signed in as</span>
                <span className="font-semibold truncate max-w-40">
                  {me?.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-70">Saved card</span>
                <span className="font-semibold">
                  {payment.cardNumber ? maskCard(payment.cardNumber) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-70">Cart items</span>
                <span className="font-semibold">{cartCount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => nav("/cart")}
              className="mt-5 btn w-full rounded-xl bg-white border border-black/10 hover:bg-black/5 font-bold"
            >
              Go to cart
            </button>

            <button
              type="button"
              onClick={() => logout().then(() => nav("/", { replace: true }))}
              className="mt-2 btn w-full rounded-xl bg-white border border-black/10 hover:bg-black/5 font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
