"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { mergeDeep } from "@/lib/mergeDeep";
import {
  defaultAboutSections,
  defaultFooterSections,
  defaultHomeSections,
} from "@/lib/siteContentDefaults";

type HomeState = {
  hero: {
    slideImages: string[];
    badge: string;
    titleLine1: string;
    titleAccent: string;
    titleLine2: string;
    desc: string;
    btn1: string;
    btn2: string;
    stats: { value: string; label: string }[];
    slideLabel: string;
  };
};

type AboutState = {
  main: {
    sectionLabel: string;
    h2Line1: string;
    h2Accent: string;
    p1: string;
    p2: string;
    imageBuildingName: string;
    imageBuildingSubtitle: string;
    yearsBadgeValue: string;
    yearsLabel: string;
    stats: { value: string; label: string }[];
  };
};

type FooterState = {
  partners: {
    partnersLabel: string;
    items: { name: string; src: string; width: number; height: number }[];
  };
  brand: { desc: string };
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

async function fetchSections(
  base: string,
  pageId: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${base}/api/v1/admin/site-pages/${pageId}`);
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as { data?: { sections?: unknown } };
  const s = json.data?.sections;
  return s && typeof s === "object" && !Array.isArray(s)
    ? (s as Record<string, unknown>)
    : {};
}

export default function SiteContentPage() {
  const base = getApiBaseUrl();
  const [tab, setTab] = useState<"home" | "about" | "footer">("home");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [home, setHome] = useState<HomeState>(() =>
    mergeDeep(clone(defaultHomeSections), {}) as HomeState,
  );
  const [about, setAbout] = useState<AboutState>(() =>
    mergeDeep(clone(defaultAboutSections), {}) as AboutState,
  );
  const [footer, setFooter] = useState<FooterState>(() =>
    mergeDeep(clone(defaultFooterSections), {}) as FooterState,
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [h, a, f] = await Promise.all([
        fetchSections(base, "home"),
        fetchSections(base, "about"),
        fetchSections(base, "footer"),
      ]);
      setHome(mergeDeep(clone(defaultHomeSections), h) as HomeState);
      setAbout(mergeDeep(clone(defaultAboutSections), a) as AboutState);
      setFooter(mergeDeep(clone(defaultFooterSections), f) as FooterState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(pageId: "home" | "about" | "footer") {
    setError(null);
    setSaved(null);
    const sections =
      pageId === "home" ? home : pageId === "about" ? about : footer;
    try {
      const res = await fetch(`${base}/api/v1/admin/site-pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved("Хадгалагдлаа.");
      setTimeout(() => setSaved(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Нүүр, Бидний тухай, Хөл хэсгүүдийг тусад нь засварлана. Өөрчлөлт вэбд хэдэн
        секундын дараа харагдана (кэш шинэчлэгдэнэ).
      </p>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          {saved}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700">
        {(
          [
            ["home", "Нүүр (Hero)"],
            ["about", "Бидний тухай"],
            ["footer", "Хөл (лого, танилцуулга)"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {loading ? "Уншиж байна…" : "Дахин ачаалах"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Ачаалж байна…</p>
      ) : tab === "home" ? (
        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Слайдын зургууд (мөр бүрт нэг зам, public/ доорх)
            </label>
            <textarea
              className={`${inputClass} min-h-[100px] font-mono text-xs`}
              value={home.hero.slideImages.join("\n")}
              onChange={(e) =>
                setHome({
                  ...home,
                  hero: {
                    ...home.hero,
                    slideImages: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </div>
          {(
            [
              ["badge", "Badge"],
              ["titleLine1", "Гарчиг 1"],
              ["titleAccent", "Гарчиг онцлох"],
              ["titleLine2", "Гарчиг 2"],
              ["btn1", "Товч 1"],
              ["btn2", "Товч 2"],
              ["slideLabel", "Слайд aria нэр"],
            ] as const
          ).map(([key, lab]) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {lab}
              </label>
              <input
                className={inputClass}
                value={home.hero[key] as string}
                onChange={(e) =>
                  setHome({
                    ...home,
                    hero: { ...home.hero, [key]: e.target.value },
                  })
                }
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Тайлбар
            </label>
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={home.hero.desc}
              onChange={(e) =>
                setHome({
                  ...home,
                  hero: { ...home.hero, desc: e.target.value },
                })
              }
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Статистик
            </p>
            <div className="space-y-3">
              {home.hero.stats.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    className={`${inputClass} max-w-[140px]`}
                    placeholder="Утга"
                    value={row.value}
                    onChange={(e) => {
                      const stats = [...home.hero.stats];
                      stats[i] = { ...stats[i], value: e.target.value };
                      setHome({ ...home, hero: { ...home.hero, stats } });
                    }}
                  />
                  <input
                    className={`${inputClass} min-w-[200px] flex-1`}
                    placeholder="Шошго"
                    value={row.label}
                    onChange={(e) => {
                      const stats = [...home.hero.stats];
                      stats[i] = { ...stats[i], label: e.target.value };
                      setHome({ ...home, hero: { ...home.hero, stats } });
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-md border border-red-300 px-2 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                    onClick={() => {
                      const stats = home.hero.stats.filter((_, j) => j !== i);
                      setHome({ ...home, hero: { ...home.hero, stats } });
                    }}
                  >
                    Устгах
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-emerald-700 underline dark:text-emerald-400"
                onClick={() =>
                  setHome({
                    ...home,
                    hero: {
                      ...home.hero,
                      stats: [...home.hero.stats, { value: "", label: "" }],
                    },
                  })
                }
              >
                + Мөр нэмэх
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void save("home")}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Нүүр хадгалах
          </button>
        </div>
      ) : tab === "about" ? (
        <div className="space-y-6">
          {(
            [
              ["sectionLabel", "Хэсгийн шошго"],
              ["h2Line1", "Гарчиг 1"],
              ["h2Accent", "Гарчиг онцлох"],
              ["imageBuildingName", "Барилгын нэр (зураг дээр)"],
              ["imageBuildingSubtitle", "Дэд гарчиг"],
              ["yearsBadgeValue", "Жилийн тоо (жижиг хайрцаг)"],
              ["yearsLabel", "Жилийн шошго"],
            ] as const
          ).map(([key, lab]) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {lab}
              </label>
              <input
                className={inputClass}
                value={about.main[key] as string}
                onChange={(e) =>
                  setAbout({
                    ...about,
                    main: { ...about.main, [key]: e.target.value },
                  })
                }
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Параграф 1
            </label>
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={about.main.p1}
              onChange={(e) =>
                setAbout({ ...about, main: { ...about.main, p1: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Параграф 2
            </label>
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={about.main.p2}
              onChange={(e) =>
                setAbout({ ...about, main: { ...about.main, p2: e.target.value } })
              }
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Статистик
            </p>
            <div className="space-y-3">
              {about.main.stats.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    className={`${inputClass} max-w-[140px]`}
                    value={row.value}
                    onChange={(e) => {
                      const stats = [...about.main.stats];
                      stats[i] = { ...stats[i], value: e.target.value };
                      setAbout({ ...about, main: { ...about.main, stats } });
                    }}
                  />
                  <input
                    className={`${inputClass} min-w-[200px] flex-1`}
                    value={row.label}
                    onChange={(e) => {
                      const stats = [...about.main.stats];
                      stats[i] = { ...stats[i], label: e.target.value };
                      setAbout({ ...about, main: { ...about.main, stats } });
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-md border border-red-300 px-2 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                    onClick={() => {
                      const stats = about.main.stats.filter((_, j) => j !== i);
                      setAbout({ ...about, main: { ...about.main, stats } });
                    }}
                  >
                    Устгах
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-emerald-700 underline dark:text-emerald-400"
                onClick={() =>
                  setAbout({
                    ...about,
                    main: {
                      ...about.main,
                      stats: [...about.main.stats, { value: "", label: "" }],
                    },
                  })
                }
              >
                + Мөр нэмэх
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void save("about")}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Бидний тухай хадгалах
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Лого хэсгийн гарчиг
            </label>
            <input
              className={inputClass}
              value={footer.partners.partnersLabel}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  partners: { ...footer.partners, partnersLabel: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Танилцуулга (брэндийн текст)
            </label>
            <textarea
              className={`${inputClass} min-h-[90px]`}
              value={footer.brand.desc}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  brand: { desc: e.target.value },
                })
              }
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Түншүүд (лого)
            </p>
            <div className="space-y-4">
              {footer.partners.items.map((row, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-xs text-zinc-500">Нэр</label>
                      <input
                        className={inputClass}
                        value={row.name}
                        onChange={(e) => {
                          const items = [...footer.partners.items];
                          items[i] = { ...items[i], name: e.target.value };
                          setFooter({
                            ...footer,
                            partners: { ...footer.partners, items },
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">
                        Зургийн зам (ж: /logos/x.svg)
                      </label>
                      <input
                        className={inputClass}
                        value={row.src}
                        onChange={(e) => {
                          const items = [...footer.partners.items];
                          items[i] = { ...items[i], src: e.target.value };
                          setFooter({
                            ...footer,
                            partners: { ...footer.partners, items },
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Өргөн</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={row.width}
                        onChange={(e) => {
                          const items = [...footer.partners.items];
                          items[i] = {
                            ...items[i],
                            width: Number(e.target.value) || 0,
                          };
                          setFooter({
                            ...footer,
                            partners: { ...footer.partners, items },
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Өндөр</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={row.height}
                        onChange={(e) => {
                          const items = [...footer.partners.items];
                          items[i] = {
                            ...items[i],
                            height: Number(e.target.value) || 0,
                          };
                          setFooter({
                            ...footer,
                            partners: { ...footer.partners, items },
                          });
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs text-red-600 dark:text-red-400"
                    onClick={() => {
                      const items = footer.partners.items.filter((_, j) => j !== i);
                      setFooter({
                        ...footer,
                        partners: { ...footer.partners, items },
                      });
                    }}
                  >
                    Энэ түншийг устгах
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-emerald-700 underline dark:text-emerald-400"
                onClick={() =>
                  setFooter({
                    ...footer,
                    partners: {
                      ...footer.partners,
                      items: [
                        ...footer.partners.items,
                        { name: "", src: "/logos/ing.svg", width: 100, height: 36 },
                      ],
                    },
                  })
                }
              >
                + Түнш нэмэх
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void save("footer")}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Хөл хадгалах
          </button>
        </div>
      )}
    </div>
  );
}
