"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import { mergeDeep } from "@/lib/mergeDeep";
import {
  defaultAboutSections,
  defaultContactSections,
  defaultFooterSections,
  defaultHomeSections,
  defaultSalesPageSections,
  defaultServicesSections,
} from "@/lib/siteContentDefaults";
import {
  Briefcase,
  Building2,
  Home,
  LayoutGrid,
  Megaphone,
  Phone,
  Trash2,
} from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import {
  DangerMini,
  EditorAlerts,
  EditorBody,
  EditorSection,
  EditorSurface,
  EditorTabRail,
  EditorTabSelect,
  GhostButton,
  PrimarySave,
  scInput,
  scTextarea,
} from "./editorUi";

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

type ContactState = typeof defaultContactSections;
type ServicesState = typeof defaultServicesSections;
type SalesPageState = typeof defaultSalesPageSections;

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

const TABS = [
  { id: "home" as const, label: "Нүүр", hint: "Hero, слайд, статистик", icon: Home },
  { id: "about" as const, label: "Бидний тухай", hint: "Танилцуулга, статистик", icon: Building2 },
  { id: "services" as const, label: "Үйлчилгээ", hint: "Давуу тал, тоонууд", icon: Briefcase },
  { id: "contact" as const, label: "Холбоо барих", hint: "Хаяг, утас, кард", icon: Phone },
  {
    id: "sales-page" as const,
    label: "Борлуулалт",
    hint: "Зарын хуудасны толгой",
    icon: Megaphone,
  },
  { id: "footer" as const, label: "Хөл", hint: "Түншүүд, танилцуулга", icon: LayoutGrid },
];

type TabId = (typeof TABS)[number]["id"];

export default function SiteContentPage() {
  const base = getApiBaseUrl();
  const [tab, setTab] = useState<TabId>("home");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [home, setHome] = useState<HomeState>(() =>
    mergeDeep(clone(defaultHomeSections), {}) as HomeState,
  );
  const [about, setAbout] = useState<AboutState>(() =>
    mergeDeep(clone(defaultAboutSections), {}) as AboutState,
  );
  const [footer, setFooter] = useState<FooterState>(() =>
    mergeDeep(clone(defaultFooterSections), {}) as FooterState,
  );
  const [contact, setContact] = useState<ContactState>(() =>
    mergeDeep(clone(defaultContactSections), {}) as ContactState,
  );
  const [services, setServices] = useState<ServicesState>(() =>
    mergeDeep(clone(defaultServicesSections), {}) as ServicesState,
  );
  const [salesPage, setSalesPage] = useState<SalesPageState>(() =>
    mergeDeep(clone(defaultSalesPageSections), {}) as SalesPageState,
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [h, a, svc, c, sp, f] = await Promise.all([
        fetchSections(base, "home"),
        fetchSections(base, "about"),
        fetchSections(base, "services"),
        fetchSections(base, "contact"),
        fetchSections(base, "sales-page"),
        fetchSections(base, "footer"),
      ]);
      setHome(mergeDeep(clone(defaultHomeSections), h) as HomeState);
      setAbout(mergeDeep(clone(defaultAboutSections), a) as AboutState);
      setServices(mergeDeep(clone(defaultServicesSections), svc) as ServicesState);
      setContact(mergeDeep(clone(defaultContactSections), c) as ContactState);
      setSalesPage(mergeDeep(clone(defaultSalesPageSections), sp) as SalesPageState);
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

  async function save(pageId: (typeof TABS)[number]["id"]) {
    setError(null);
    setSaved(null);
    setSaving(true);
    const sections =
      pageId === "home"
        ? home
        : pageId === "about"
          ? about
          : pageId === "services"
            ? services
            : pageId === "contact"
              ? contact
              : pageId === "sales-page"
                ? salesPage
                : footer;
    try {
      const res = await fetch(`${base}/api/v1/admin/site-pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (!res.ok) throw new Error(await res.text());

      const rev = await fetch("/api/revalidate-front", { method: "POST" });
      if (!rev.ok) {
        const t = await rev.text();
        console.warn("revalidate-front:", t);
      }

      setSaved("Хадгалагдлаа. Сайт шинэчлэгдлээ.");
      setTimeout(() => setSaved(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-none space-y-4 pb-8">
      <EditorAlerts error={error} saved={saved} />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="hidden lg:block lg:sticky lg:top-0 lg:max-h-[calc(100dvh-5.5rem)] lg:w-full lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200/80 lg:bg-gradient-to-b lg:from-slate-50 lg:to-white lg:p-4 lg:shadow-sm dark:lg:border-slate-800 dark:lg:from-slate-950 dark:lg:to-slate-900">
          <EditorTabRail
            tabs={TABS}
            active={tab}
            onSelect={(id) => setTab(id as TabId)}
            onReload={() => void load()}
            loading={loading}
            saving={saving}
          />
        </aside>

        <div className="min-w-0 space-y-4">
          <EditorTabSelect tabs={TABS} active={tab} onSelect={(id) => setTab(id as TabId)} />

          <EditorSurface>
            <header className="mb-6 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
                Засварлаж буй хуудас
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {TABS.find((t) => t.id === tab)?.label ?? ""}
              </h2>
              <p className="mt-1 w-full text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {TABS.find((t) => t.id === tab)?.hint}
              </p>
            </header>
            {loading ? (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ачаалж байна…</p>
            ) : tab === "home" ? (
        <EditorBody
          sectionJumpKey={tab}
          sectionItems={[
            { id: "home-slides", label: "Слайд" },
            { id: "home-hero", label: "Hero текст" },
            { id: "home-desc", label: "Тайлбар" },
            { id: "home-stats", label: "Статистик" },
          ]}
        >
          <EditorSection
            id="home-slides"
            title="Слайдын зургууд"
            subtitle="Зураг оруулах — серверийн upload (/upload/…). /images/… замыг гараар засаж болно."
          >
            <div className="space-y-3">
              {home.hero.slideImages.map((path, i) => (
                <ImageUploadField
                  key={`slide-${i}`}
                  value={path}
                  onChange={(next) => {
                    const slideImages = [...home.hero.slideImages];
                    slideImages[i] = next;
                    setHome({ ...home, hero: { ...home.hero, slideImages } });
                  }}
                  showRemove
                  onRemove={() => {
                    const slideImages = home.hero.slideImages.filter((_, j) => j !== i);
                    setHome({ ...home, hero: { ...home.hero, slideImages } });
                  }}
                />
              ))}
              <GhostButton
                className="font-medium"
                onClick={() =>
                  setHome({
                    ...home,
                    hero: {
                      ...home.hero,
                      slideImages: [...home.hero.slideImages, ""],
                    },
                  })
                }
              >
                + Слайд нэмэх
              </GhostButton>
            </div>
          </EditorSection>
          <EditorSection
            id="home-hero"
            title="Hero текст"
            subtitle="Badge, гарчиг, товчнууд, слайдын aria нэр"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    className={scInput}
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
            </div>
          </EditorSection>
          <EditorSection id="home-desc" title="Тайлбар">
            <textarea
              className={scTextarea("min-h-[100px]")}
              value={home.hero.desc}
              onChange={(e) =>
                setHome({
                  ...home,
                  hero: { ...home.hero, desc: e.target.value },
                })
              }
            />
          </EditorSection>
          <EditorSection id="home-stats" title="Статистик" defaultOpen={false}>
            <div className="space-y-3">
              {home.hero.stats.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    className={`${scInput} max-w-[140px]`}
                    placeholder="Утга"
                    value={row.value}
                    onChange={(e) => {
                      const stats = [...home.hero.stats];
                      stats[i] = { ...stats[i], value: e.target.value };
                      setHome({ ...home, hero: { ...home.hero, stats } });
                    }}
                  />
                  <input
                    className={`${scInput} min-w-[200px] flex-1`}
                    placeholder="Шошго"
                    value={row.label}
                    onChange={(e) => {
                      const stats = [...home.hero.stats];
                      stats[i] = { ...stats[i], label: e.target.value };
                      setHome({ ...home, hero: { ...home.hero, stats } });
                    }}
                  />
                  <DangerMini
                    onClick={() => {
                      const stats = home.hero.stats.filter((_, j) => j !== i);
                      setHome({ ...home, hero: { ...home.hero, stats } });
                    }}
                  >
                    Устгах
                  </DangerMini>
                </div>
              ))}
              <GhostButton
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
              </GhostButton>
            </div>
          </EditorSection>
          <PrimarySave disabled={saving} onClick={() => void save("home")}>
            {saving ? "Хадгалж байна…" : "Нүүр хадгалах"}
          </PrimarySave>
        </EditorBody>
      ) : tab === "about" ? (
        <EditorBody
          sectionJumpKey={tab}
          sectionItems={[
            { id: "about-fields", label: "Текст талбарууд" },
            { id: "about-copy", label: "Параграф" },
            { id: "about-stats", label: "Статистик" },
          ]}
        >
          <EditorSection
            id="about-fields"
            title="Текст талбарууд"
            subtitle="Шошго, гарчиг, барилгын нэр, жилийн хайрцаг"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    className={scInput}
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
            </div>
          </EditorSection>
          <EditorSection id="about-copy" title="Параграфууд">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Параграф 1
                </label>
                <textarea
                  className={scTextarea("min-h-[100px]")}
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
                  className={scTextarea("min-h-[100px]")}
                  value={about.main.p2}
                  onChange={(e) =>
                    setAbout({ ...about, main: { ...about.main, p2: e.target.value } })
                  }
                />
              </div>
            </div>
          </EditorSection>
          <EditorSection id="about-stats" title="Статистик" defaultOpen={false}>
            <div className="space-y-3">
              {about.main.stats.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    className={`${scInput} max-w-[140px]`}
                    value={row.value}
                    onChange={(e) => {
                      const stats = [...about.main.stats];
                      stats[i] = { ...stats[i], value: e.target.value };
                      setAbout({ ...about, main: { ...about.main, stats } });
                    }}
                  />
                  <input
                    className={`${scInput} min-w-[200px] flex-1`}
                    value={row.label}
                    onChange={(e) => {
                      const stats = [...about.main.stats];
                      stats[i] = { ...stats[i], label: e.target.value };
                      setAbout({ ...about, main: { ...about.main, stats } });
                    }}
                  />
                  <DangerMini
                    onClick={() => {
                      const stats = about.main.stats.filter((_, j) => j !== i);
                      setAbout({ ...about, main: { ...about.main, stats } });
                    }}
                  >
                    Устгах
                  </DangerMini>
                </div>
              ))}
              <GhostButton
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
              </GhostButton>
            </div>
          </EditorSection>
          <PrimarySave disabled={saving} onClick={() => void save("about")}>
            {saving ? "Хадгалж байна…" : "Бидний тухай хадгалах"}
          </PrimarySave>
        </EditorBody>
      ) : tab === "services" ? (
        <EditorBody
          sectionJumpKey={tab}
          sectionItems={[
            { id: "svc-header", label: "Толгой" },
            { id: "svc-features", label: "Давуу тал" },
            { id: "svc-banner", label: "Баннер" },
          ]}
        >
          <EditorSection id="svc-header" title="Толгой хэсэг" subtitle="Шошго, гарчиг, танилцуулга">
            <div className="grid gap-4 lg:grid-cols-3">
              {(
                [
                  ["badge", "Дээд шошго"],
                  ["h2Line1", "Гарчиг (эхний хэсэг)"],
                  ["h2Accent", "Гарчиг (онцлох өнгө)"],
                ] as const
              ).map(([key, lab]) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {lab}
                  </label>
                  <input
                    className={scInput}
                    value={services.header[key]}
                    onChange={(e) =>
                      setServices({
                        ...services,
                        header: { ...services.header, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Танилцуулга
              </label>
              <textarea
                className={scTextarea("min-h-[80px]")}
                value={services.header.intro}
                onChange={(e) =>
                  setServices({
                    ...services,
                    header: { ...services.header, intro: e.target.value },
                  })
                }
              />
            </div>
          </EditorSection>
          <EditorSection id="svc-features" title="Давуу талууд" subtitle="4 хүртэл" defaultOpen={false}>
            <div className="space-y-4">
              {services.features.map((f, i) => (
                <div key={i} className="rounded-xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <input
                    className={scInput}
                    placeholder="Гарчиг"
                    value={f.title}
                    onChange={(e) => {
                      const features = [...services.features];
                      features[i] = { ...features[i], title: e.target.value };
                      setServices({ ...services, features });
                    }}
                  />
                  <textarea
                    className={`mt-2 ${scTextarea("min-h-[72px]")}`}
                    placeholder="Тайлбар"
                    value={f.desc}
                    onChange={(e) => {
                      const features = [...services.features];
                      features[i] = { ...features[i], desc: e.target.value };
                      setServices({ ...services, features });
                    }}
                  />
                  <DangerMini
                    className="mt-2"
                    onClick={() =>
                      setServices({
                        ...services,
                        features: services.features.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Устгах
                  </DangerMini>
                </div>
              ))}
              <GhostButton
                onClick={() =>
                  setServices({
                    ...services,
                    features: [...services.features, { title: "", desc: "" }],
                  })
                }
              >
                + Онцлол нэмэх
              </GhostButton>
            </div>
          </EditorSection>
          <EditorSection id="svc-banner" title="Доод баннер" subtitle="Тоо, дагалдах, шошго" defaultOpen={false}>
            <div className="space-y-3">
              {services.banner.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    className={`${scInput} max-w-[100px]`}
                    placeholder="Утга"
                    value={row.value}
                    onChange={(e) => {
                      const banner = [...services.banner];
                      banner[i] = { ...banner[i], value: e.target.value };
                      setServices({ ...services, banner });
                    }}
                  />
                  <input
                    className={`${scInput} max-w-[80px]`}
                    placeholder="Дагалдах"
                    value={row.suffix}
                    onChange={(e) => {
                      const banner = [...services.banner];
                      banner[i] = { ...banner[i], suffix: e.target.value };
                      setServices({ ...services, banner });
                    }}
                  />
                  <input
                    className={`${scInput} min-w-[180px] flex-1`}
                    placeholder="Шошго"
                    value={row.label}
                    onChange={(e) => {
                      const banner = [...services.banner];
                      banner[i] = { ...banner[i], label: e.target.value };
                      setServices({ ...services, banner });
                    }}
                  />
                  <DangerMini
                    onClick={() =>
                      setServices({
                        ...services,
                        banner: services.banner.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Устгах
                  </DangerMini>
                </div>
              ))}
              <GhostButton
                onClick={() =>
                  setServices({
                    ...services,
                    banner: [...services.banner, { value: "", suffix: "", label: "" }],
                  })
                }
              >
                + Баннер мөр нэмэх
              </GhostButton>
            </div>
          </EditorSection>
          <PrimarySave disabled={saving} onClick={() => void save("services")}>
            {saving ? "Хадгалж байна…" : "Үйлчилгээ хадгалах"}
          </PrimarySave>
        </EditorBody>
      ) : tab === "contact" ? (
        <EditorBody
          sectionJumpKey={tab}
          sectionItems={[
            { id: "contact-hero", label: "Толгой" },
            { id: "contact-items", label: "Мөрүүд" },
            { id: "contact-agent", label: "Менежер" },
            { id: "contact-form", label: "Форм" },
          ]}
        >
          <EditorSection id="contact-hero" title="Толгой хэсэг" subtitle="Шошго, гарчиг, танилцуулга">
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["badge", "Дээд шошго"],
                  ["h2Accent", "Гол гарчиг (онцлох)"],
                ] as const
              ).map(([key, lab]) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {lab}
                  </label>
                  <input
                    className={scInput}
                    value={contact.hero[key]}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        hero: { ...contact.hero, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Танилцуулга
              </label>
              <textarea
                className={scTextarea("min-h-[80px]")}
                value={contact.hero.intro}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    hero: { ...contact.hero, intro: e.target.value },
                  })
                }
              />
            </div>
          </EditorSection>
          <EditorSection id="contact-items" title="Мэдээллийн мөрүүд" defaultOpen={false}>
            <div className="space-y-3">
              {contact.items.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    className={`${scInput} max-w-[160px]`}
                    placeholder="Гарчиг"
                    value={row.title}
                    onChange={(e) => {
                      const items = [...contact.items];
                      items[i] = { ...items[i], title: e.target.value };
                      setContact({ ...contact, items });
                    }}
                  />
                  <input
                    className={`${scInput} min-w-[200px] flex-1`}
                    placeholder="Утга"
                    value={row.value}
                    onChange={(e) => {
                      const items = [...contact.items];
                      items[i] = { ...items[i], value: e.target.value };
                      setContact({ ...contact, items });
                    }}
                  />
                  <DangerMini
                    onClick={() =>
                      setContact({
                        ...contact,
                        items: contact.items.filter((_, j) => j !== i),
                      })
                    }
                  >
                    Устгах
                  </DangerMini>
                </div>
              ))}
              <GhostButton
                onClick={() =>
                  setContact({
                    ...contact,
                    items: [...contact.items, { title: "", value: "" }],
                  })
                }
              >
                + Мөр нэмэх
              </GhostButton>
            </div>
          </EditorSection>
          <EditorSection id="contact-agent" title="Менежерийн кард" defaultOpen={false}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["initials", "Эхний үсэг"],
                  ["name", "Нэр"],
                  ["role", "Албан тушаал"],
                  ["telHref", "Утас (ж: tel:+976…)"],
                  ["telLabel", "Товчны текст"],
                ] as const
              ).map(([key, lab]) => (
                <div key={key} className={key === "role" ? "sm:col-span-2 lg:col-span-3" : ""}>
                  <label className="text-xs text-zinc-500">{lab}</label>
                  <input
                    className={scInput}
                    value={contact.agent[key]}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        agent: { ...contact.agent, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </EditorSection>
          <EditorSection id="contact-form" title="Формын гарчиг">
            <input
              className={scInput}
              value={contact.formTitle}
              onChange={(e) => setContact({ ...contact, formTitle: e.target.value })}
            />
          </EditorSection>
          <PrimarySave disabled={saving} onClick={() => void save("contact")}>
            {saving ? "Хадгалж байна…" : "Холбоо барих хадгалах"}
          </PrimarySave>
        </EditorBody>
      ) : tab === "sales-page" ? (
        <EditorBody
          sectionJumpKey={tab}
          sectionItems={[
            { id: "sales-meta", label: "Шошго & гарчиг" },
            { id: "sales-intro", label: "Танилцуулга" },
          ]}
        >
          <EditorSection id="sales-meta" title="Шошго болон гарчиг">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Дээд шошго
                </label>
                <input
                  className={scInput}
                  value={salesPage.header.eyebrow}
                  onChange={(e) =>
                    setSalesPage({
                      ...salesPage,
                      header: { ...salesPage.header, eyebrow: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Гол гарчиг
                </label>
                <input
                  className={scInput}
                  value={salesPage.header.title}
                  onChange={(e) =>
                    setSalesPage({
                      ...salesPage,
                      header: { ...salesPage.header, title: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </EditorSection>
          <EditorSection id="sales-intro" title="Танилцуулга">
            <textarea
              className={scTextarea("min-h-[100px]")}
              value={salesPage.header.intro}
              onChange={(e) =>
                setSalesPage({
                  ...salesPage,
                  header: { ...salesPage.header, intro: e.target.value },
                })
              }
            />
          </EditorSection>
          <PrimarySave disabled={saving} onClick={() => void save("sales-page")}>
            {saving ? "Хадгалж байна…" : "Борлуулалтын хуудас хадгалах"}
          </PrimarySave>
        </EditorBody>
      ) : (
        <EditorBody
          sectionJumpKey={tab}
          sectionItems={[
            { id: "footer-brand", label: "Брэнд" },
            { id: "footer-partners", label: "Түншүүд" },
          ]}
        >
          <EditorSection
            id="footer-brand"
            title="Лого хэсэг & брэнд"
            subtitle="Хөлийн түншүүдийн гарчиг болон брэндийн танилцуулга"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Лого хэсгийн гарчиг
                </label>
                <input
                  className={scInput}
                  value={footer.partners.partnersLabel}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      partners: { ...footer.partners, partnersLabel: e.target.value },
                    })
                  }
                />
              </div>
              <div className="lg:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Танилцуулга (брэндийн текст)
                </label>
                <textarea
                  className={scTextarea("min-h-[90px]")}
                  value={footer.brand.desc}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      brand: { desc: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </EditorSection>
          <EditorSection
            id="footer-partners"
            title="Түншүүд (лого)"
            subtitle="Лого файлуудыг public/ доор байршуулж, энд зөвхөн замыг оруулна (ж: /logos/x.svg)."
            defaultOpen={false}
          >
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
                        className={scInput}
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
                    <div className="sm:col-span-2">
                      <ImageUploadField
                        previewFit="contain"
                        value={row.src}
                        onChange={(next) => {
                          const items = [...footer.partners.items];
                          items[i] = { ...items[i], src: next };
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
                        className={scInput}
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
                        className={scInput}
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
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
                      onClick={() => {
                        const items = footer.partners.items.filter((_, j) => j !== i);
                        setFooter({
                          ...footer,
                          partners: { ...footer.partners, items },
                        });
                      }}
                      aria-label="Түнш устгах"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
              <GhostButton
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
              </GhostButton>
            </div>
          </EditorSection>
          <PrimarySave disabled={saving} onClick={() => void save("footer")}>
            {saving ? "Хадгалж байна…" : "Хөл хадгалах"}
          </PrimarySave>
        </EditorBody>
      )}
          </EditorSurface>
        </div>
      </div>
    </div>
  );
}
