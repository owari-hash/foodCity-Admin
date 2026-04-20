"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import {
  ensureClientAuthorized,
  PERMISSION_DENIED_MN,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import {
  Briefcase,
  Building2,
  ClipboardList,
  Home,
  LayoutGrid,
  Megaphone,
  Newspaper,
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
    imageUrl: string;
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

type ContactState = {
  hero: { badge: string; h2Accent: string; intro: string };
  items: { title: string; value: string }[];
  agent: {
    initials: string;
    name: string;
    role: string;
    telHref: string;
    telLabel: string;
  };
  formTitle: string;
};
type ServicesState = {
  header: { badge: string; h2Line1: string; h2Accent: string; intro: string };
  features: { title: string; desc: string }[];
  banner: { value: string; suffix: string; label: string }[];
};
type PropertiesPageState = {
  header: {
    badge: string;
    titleLine1: string;
    titleAccent: string;
    intro: string;
  };
  categories: string[];
  items: {
    id: number;
    name: string;
    image: string;
    category: string;
    badge: string | null;
    size: string;
    floor: string;
    parking: string;
    price: string;
    tag: string;
    description: string;
  }[];
  cta: { href: string; label: string };
};
type SalesPageState = { header: { eyebrow: string; title: string; intro: string } };
type JobsPageState = { header: { title: string; intro: string } };
type TeamPageState = {
  header: { eyebrow: string; h2Line1: string; h2Accent: string; intro: string };
  members: {
    name: string;
    role: string;
    initials: string;
    color: string;
    phone: string;
    email: string;
    bio: string;
    projects: number;
  }[];
  cta: { title: string; subtitle: string; buttonLabel: string; buttonHref: string };
};

const EMPTY_HOME: HomeState = {
  hero: {
    slideImages: [],
    badge: "",
    titleLine1: "",
    titleAccent: "",
    titleLine2: "",
    desc: "",
    btn1: "",
    btn2: "",
    stats: [],
    slideLabel: "",
  },
};
const EMPTY_ABOUT: AboutState = {
  main: {
    sectionLabel: "",
    h2Line1: "",
    h2Accent: "",
    p1: "",
    p2: "",
    imageUrl: "",
    imageBuildingName: "",
    imageBuildingSubtitle: "",
    yearsBadgeValue: "",
    yearsLabel: "",
    stats: [],
  },
};
const EMPTY_FOOTER: FooterState = {
  partners: { partnersLabel: "", items: [] },
  brand: { desc: "" },
};
const EMPTY_CONTACT: ContactState = {
  hero: { badge: "", h2Accent: "", intro: "" },
  items: [],
  agent: { initials: "", name: "", role: "", telHref: "", telLabel: "" },
  formTitle: "",
};
const EMPTY_SERVICES: ServicesState = {
  header: { badge: "", h2Line1: "", h2Accent: "", intro: "" },
  features: [],
  banner: [],
};
const EMPTY_PROPERTIES_PAGE: PropertiesPageState = {
  header: { badge: "", titleLine1: "", titleAccent: "", intro: "" },
  categories: [],
  items: [],
  cta: { href: "", label: "" },
};
const EMPTY_SALES_PAGE: SalesPageState = {
  header: { eyebrow: "", title: "", intro: "" },
};
const EMPTY_JOBS_PAGE: JobsPageState = {
  header: { title: "", intro: "" },
};
const EMPTY_TEAM_PAGE: TeamPageState = {
  header: { eyebrow: "", h2Line1: "", h2Accent: "", intro: "" },
  members: [],
  cta: { title: "", subtitle: "", buttonLabel: "", buttonHref: "" },
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
function normalizeHome(v: unknown): HomeState {
  const root = asRecord(v);
  const hero = asRecord(root.hero);
  return {
    hero: {
      ...EMPTY_HOME.hero,
      ...hero,
      slideImages: Array.isArray(hero.slideImages) ? (hero.slideImages as string[]) : [],
      stats: Array.isArray(hero.stats) ? (hero.stats as { value: string; label: string }[]) : [],
    },
  };
}
function normalizeAbout(v: unknown): AboutState {
  const root = asRecord(v);
  const main = asRecord(root.main);
  return {
    main: {
      ...EMPTY_ABOUT.main,
      ...main,
      stats: Array.isArray(main.stats) ? (main.stats as { value: string; label: string }[]) : [],
    },
  };
}
function normalizeFooter(v: unknown): FooterState {
  const root = asRecord(v);
  const partners = asRecord(root.partners);
  const brand = asRecord(root.brand);
  return {
    partners: {
      ...EMPTY_FOOTER.partners,
      ...partners,
      items: Array.isArray(partners.items)
        ? (partners.items as { name: string; src: string; width: number; height: number }[])
        : [],
    },
    brand: { ...EMPTY_FOOTER.brand, ...brand },
  };
}
function normalizeContact(v: unknown): ContactState {
  const root = asRecord(v);
  return {
    hero: { ...EMPTY_CONTACT.hero, ...asRecord(root.hero) },
    items: Array.isArray(root.items) ? (root.items as { title: string; value: string }[]) : [],
    agent: { ...EMPTY_CONTACT.agent, ...asRecord(root.agent) },
    formTitle: typeof root.formTitle === "string" ? root.formTitle : "",
  };
}
function normalizeServices(v: unknown): ServicesState {
  const root = asRecord(v);
  return {
    header: { ...EMPTY_SERVICES.header, ...asRecord(root.header) },
    features: Array.isArray(root.features) ? (root.features as { title: string; desc: string }[]) : [],
    banner: Array.isArray(root.banner)
      ? (root.banner as { value: string; suffix: string; label: string }[])
      : [],
  };
}
function normalizePropertiesPage(v: unknown): PropertiesPageState {
  const root = asRecord(v);
  return {
    header: { ...EMPTY_PROPERTIES_PAGE.header, ...asRecord(root.header) },
    categories: Array.isArray(root.categories) ? (root.categories as string[]) : [],
    items: Array.isArray(root.items)
      ? (root.items as PropertiesPageState["items"])
      : [],
    cta: { ...EMPTY_PROPERTIES_PAGE.cta, ...asRecord(root.cta) },
  };
}
function normalizeSalesPage(v: unknown): SalesPageState {
  const root = asRecord(v);
  return { header: { ...EMPTY_SALES_PAGE.header, ...asRecord(root.header) } };
}
function normalizeJobsPage(v: unknown): JobsPageState {
  const root = asRecord(v);
  return { header: { ...EMPTY_JOBS_PAGE.header, ...asRecord(root.header) } };
}
function normalizeTeamPage(v: unknown): TeamPageState {
  const root = asRecord(v);
  return {
    header: { ...EMPTY_TEAM_PAGE.header, ...asRecord(root.header) },
    members: Array.isArray(root.members)
      ? (root.members as TeamPageState["members"])
      : [],
    cta: { ...EMPTY_TEAM_PAGE.cta, ...asRecord(root.cta) },
  };
}

async function fetchSections(pageId: string, lang: string): Promise<Record<string, unknown>> {
  const res = await fetch(
    joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/site-pages/${pageId}?lang=${lang}`),
    withClientAdminAuth(),
  );
  const gate = await ensureClientAuthorized(res);
  if (gate === "forbidden") throw new Error("FC_FORBIDDEN");
  if (gate !== "ok") return {};
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as { data?: { sections?: unknown } };
  const s = json.data?.sections;
  return s && typeof s === "object" && !Array.isArray(s)
    ? (s as Record<string, unknown>)
    : {};
}

export function useTabs() {
  const { t } = useAdminLanguage();
  return [
    {
      id: "home" as const,
      label: t.siteContent.tabs.home.label,
      hint: t.siteContent.tabs.home.hint,
      icon: Home,
    },
    {
      id: "about" as const,
      label: t.siteContent.tabs.about.label,
      hint: t.siteContent.tabs.about.hint,
      icon: Building2,
    },
    {
      id: "services" as const,
      label: t.siteContent.tabs.services.label,
      hint: t.siteContent.tabs.services.hint,
      icon: Briefcase,
    },
    {
      id: "contact" as const,
      label: t.siteContent.tabs.contact.label,
      hint: t.siteContent.tabs.contact.hint,
      icon: Phone,
    },
    {
      id: "properties-page" as const,
      label: t.siteContent.tabs.propertiesPage.label,
      hint: t.siteContent.tabs.propertiesPage.hint,
      icon: Building2,
    },
    {
      id: "sales-page" as const,
      label: t.siteContent.tabs.salesPage.label,
      hint: t.siteContent.tabs.salesPage.hint,
      icon: Megaphone,
    },
    {
      id: "jobs-page" as const,
      label: t.siteContent.tabs.jobsPage.label,
      hint: t.siteContent.tabs.jobsPage.hint,
      icon: ClipboardList,
    },
    {
      id: "team" as const,
      label: t.siteContent.tabs.team.label,
      hint: t.siteContent.tabs.team.hint,
      icon: Newspaper,
    },
    {
      id: "footer" as const,
      label: t.siteContent.tabs.footer.label,
      hint: t.siteContent.tabs.footer.hint,
      icon: LayoutGrid,
    },
  ];
}

type TabId = "home" | "about" | "services" | "contact" | "properties-page" | "sales-page" | "jobs-page" | "team" | "footer";

export default function SiteContentPage() {
  const { lang, t } = useAdminLanguage();
  const TABS = useTabs();
  const [tab, setTab] = useState<TabId>("home");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [home, setHome] = useState<HomeState>(EMPTY_HOME);
  const [about, setAbout] = useState<AboutState>(EMPTY_ABOUT);
  const [footer, setFooter] = useState<FooterState>(EMPTY_FOOTER);
  const [contact, setContact] = useState<ContactState>(EMPTY_CONTACT);
  const [services, setServices] = useState<ServicesState>(EMPTY_SERVICES);
  const [propertiesPage, setPropertiesPage] = useState<PropertiesPageState>(
    EMPTY_PROPERTIES_PAGE,
  );
  const [salesPage, setSalesPage] = useState<SalesPageState>(EMPTY_SALES_PAGE);
  const [jobsPage, setJobsPage] = useState<JobsPageState>(EMPTY_JOBS_PAGE);
  const [teamPage, setTeamPage] = useState<TeamPageState>(EMPTY_TEAM_PAGE);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [h, a, svc, c, pp, sp, jp, tm, f] = await Promise.all([
        fetchSections("home", lang),
        fetchSections("about", lang),
        fetchSections("services", lang),
        fetchSections("contact", lang),
        fetchSections("properties-page", lang),
        fetchSections("sales-page", lang),
        fetchSections("jobs-page", lang),
        fetchSections("team", lang),
        fetchSections("footer", lang),
      ]);
      setHome(normalizeHome(h));
      setAbout(normalizeAbout(a));
      setServices(normalizeServices(svc));
      setContact(normalizeContact(c));
      setPropertiesPage(normalizePropertiesPage(pp));
      setSalesPage(normalizeSalesPage(sp));
      setJobsPage(normalizeJobsPage(jp));
      setTeamPage(normalizeTeamPage(tm));
      setFooter(normalizeFooter(f));
    } catch (e) {
      if (e instanceof Error && e.message === "FC_FORBIDDEN") {
        setError(t.siteContent.common.forbidden);
      } else {
        setError(e instanceof Error ? e.message : t.siteContent.common.error);
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const debouncedSave = useDebounce(
    async (pageId: (typeof TABS)[number]["id"], sections: unknown) => {
      setError(null);
      setSaved(null);
      setSaving(true);

      try {
        const res = await fetch(
          joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/site-pages/${pageId}?lang=${lang}`),
          withClientAdminAuth({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sections }),
          }),
        );

        const gate = await ensureClientAuthorized(res);
        if (gate === "forbidden") {
          setError(PERMISSION_DENIED_MN);
          return;
        }
        if (gate !== "ok") return;
        if (!res.ok) throw new Error(await res.text());

        setSaved(t.siteContent.common.saveSuccess);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.siteContent.common.error);
      } finally {
        setSaving(false);
      }
    },
    500,
  );

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
              : pageId === "properties-page"
                ? propertiesPage
                : pageId === "sales-page"
                  ? salesPage
                  : pageId === "jobs-page"
                    ? jobsPage
                    : pageId === "team"
                      ? teamPage
                      : footer;
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/site-pages/${pageId}?lang=${lang}`),
        withClientAdminAuth({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections }),
        }),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate === "forbidden") {
        setError(t.siteContent.common.forbidden);
        return;
      }
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      const rev = await fetch("/api/revalidate-front", { method: "POST" });
      if (!rev.ok) {
        const t = await rev.text();
        console.warn("revalidate-front:", t);
      }

      setSaved(t.siteContent.common.revalidated);
      setTimeout(() => setSaved(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.siteContent.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] w-full max-w-none min-h-0 flex-col gap-4 overflow-hidden sm:h-[calc(100dvh-6.5rem)] sm:max-h-[calc(100dvh-6.5rem)]">
      <EditorAlerts error={error} saved={saved} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:items-stretch lg:gap-6">
        <aside className="hidden h-full min-h-0 lg:block lg:w-full lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200/80 lg:bg-linear-to-b lg:from-slate-50 lg:to-white lg:p-4 lg:shadow-sm dark:lg:border-slate-800 dark:lg:from-slate-950 dark:lg:to-slate-900">
          <EditorTabRail
            tabs={TABS}
            active={tab}
            onSelect={(id) => setTab(id as TabId)}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <EditorTabSelect
            tabs={TABS}
            active={tab}
            onSelect={(id) => setTab(id as TabId)}
          />

          <EditorSurface>
            <header className="shrink-0 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
                {t.siteContent.common.editingPage}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {TABS.find((t) => t.id === tab)?.label ?? ""}
              </h2>
              <p className="mt-1 w-full text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {TABS.find((t) => t.id === tab)?.hint}
              </p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
              {loading ? (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t.common.loading}
                </p>
              ) : tab === "home" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "home-slides", label: t.siteContent.home.sections.slides },
                    { id: "home-hero", label: t.siteContent.home.sections.hero },
                    { id: "home-desc", label: t.siteContent.home.sections.desc },
                    { id: "home-stats", label: t.siteContent.home.sections.stats },
                  ]}
                >
                  <EditorSection
                    id="home-slides"
                    title={t.siteContent.home.fields.slideImages}
                    subtitle={t.siteContent.home.fields.heroSubtitle}
                  >
                    <div className="space-y-3">
                      {home.hero.slideImages.map((path, i) => (
                        <ImageUploadField
                          key={`slide-${i}`}
                          value={path}
                          onChange={(next) => {
                            const slideImages = [...home.hero.slideImages];
                            slideImages[i] = next;
                            setHome({
                              ...home,
                              hero: { ...home.hero, slideImages },
                            });
                          }}
                          showRemove
                          onRemove={() => {
                            const slideImages = home.hero.slideImages.filter(
                              (_, j) => j !== i,
                            );
                            setHome({
                              ...home,
                              hero: { ...home.hero, slideImages },
                            });
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
                        + {t.siteContent.home.fields.addSlide}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="home-hero"
                    title={t.siteContent.home.fields.heroTitle}
                    subtitle={t.siteContent.home.fields.heroSubtitle}
                  >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {(
                        [
                          ["badge", t.siteContent.home.fields.badge],
                          ["titleLine1", t.siteContent.home.fields.titleLine1],
                          ["titleAccent", t.siteContent.home.fields.titleAccent],
                          ["titleLine2", t.siteContent.home.fields.titleLine2],
                          ["btn1", t.siteContent.home.fields.btn1],
                          ["btn2", t.siteContent.home.fields.btn2],
                          ["slideLabel", t.siteContent.home.fields.slideLabel],
                        ] as const
                      ).map(([key, lab]) => (
                        <div key={key}>
                          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            {lab}
                          </label>
                          <input
                            className={scInput}
                            value={home.hero[key] as string}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setHome({
                                ...home,
                                hero: { ...home.hero, [key]: newValue },
                              });
                              debouncedSave("home", {
                                ...home,
                                hero: { ...home.hero, [key]: newValue },
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </EditorSection>
                  <EditorSection id="home-desc" title={t.siteContent.home.sections.desc}>
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
                  <EditorSection
                    id="home-stats"
                    title={t.siteContent.home.sections.stats}
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      {home.hero.stats.map((row, i) => (
                        <div key={i} className="flex flex-wrap gap-2">
                          <input
                            className={`${scInput} max-w-[140px]`}
                            placeholder={t.siteContent.common.placeholder}
                            value={row.value}
                            onChange={(e) => {
                              const stats = [...home.hero.stats];
                              stats[i] = { ...stats[i], value: e.target.value };
                              setHome({
                                ...home,
                                hero: { ...home.hero, stats },
                              });
                            }}
                          />
                          <input
                            className={`${scInput} min-w-[200px] flex-1`}
                            placeholder={t.siteContent.common.label}
                            value={row.label}
                            onChange={(e) => {
                              const stats = [...home.hero.stats];
                              stats[i] = { ...stats[i], label: e.target.value };
                              setHome({
                                ...home,
                                hero: { ...home.hero, stats },
                              });
                            }}
                          />
                          <DangerMini
                            onClick={() => {
                              const stats = home.hero.stats.filter(
                                (_, j) => j !== i,
                              );
                              setHome({
                                ...home,
                                hero: { ...home.hero, stats },
                              });
                            }}
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() =>
                          setHome({
                            ...home,
                            hero: {
                              ...home.hero,
                              stats: [
                                ...home.hero.stats,
                                { value: "", label: "" },
                              ],
                            },
                          })
                        }
                      >
                        + {t.siteContent.common.addRow}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("home")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.home.label)}
                  </PrimarySave>
                </EditorBody>
              ) : tab === "about" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "about-fields", label: t.siteContent.about.sections.fields },
                    { id: "about-image", label: t.siteContent.about.sections.image },
                    { id: "about-copy", label: t.siteContent.about.sections.copy },
                    { id: "about-stats", label: t.siteContent.about.sections.stats },
                  ]}
                >
                  <EditorSection
                    id="about-fields"
                    title={t.siteContent.about.fields.title}
                    subtitle={t.siteContent.about.fields.subtitle}
                  >
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {(
                        [
                          ["sectionLabel", t.siteContent.about.fields.sectionLabel],
                          ["h2Line1", t.siteContent.about.fields.h2Line1],
                          ["h2Accent", t.siteContent.about.fields.h2Accent],
                          ["imageBuildingName", t.siteContent.about.fields.imageBuildingName],
                          ["imageBuildingSubtitle", t.siteContent.about.fields.imageBuildingSubtitle],
                          ["yearsBadgeValue", t.siteContent.about.fields.yearsBadgeValue],
                          ["yearsLabel", t.siteContent.about.fields.yearsLabel],
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
                  <EditorSection
                    id="about-image"
                    title={t.siteContent.about.sections.image}
                    subtitle={t.siteContent.home.fields.heroSubtitle}
                  >
                    <ImageUploadField
                      value={
                        about.main.imageUrl ?? "/images/baclground-image-1.jpg"
                      }
                      onChange={(path) =>
                        setAbout({
                          ...about,
                          main: { ...about.main, imageUrl: path },
                        })
                      }
                      previewFit="cover"
                    />
                  </EditorSection>
                  <EditorSection id="about-copy" title={t.siteContent.about.sections.copy}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.about.sections.copy} 1
                        </label>
                        <textarea
                          className={scTextarea("min-h-[100px]")}
                          value={about.main.p1}
                          onChange={(e) =>
                            setAbout({
                              ...about,
                              main: { ...about.main, p1: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.about.sections.copy} 2
                        </label>
                        <textarea
                          className={scTextarea("min-h-[100px]")}
                          value={about.main.p2}
                          onChange={(e) =>
                            setAbout({
                              ...about,
                              main: { ...about.main, p2: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="about-stats"
                    title={t.siteContent.about.sections.stats}
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      {about.main.stats.map((row, i) => (
                        <div key={i} className="flex flex-wrap gap-2">
                          <input
                            className={`${scInput} max-w-[140px]`}
                            value={row.value}
                            onChange={(e) => {
                              const stats = [...about.main.stats];
                              stats[i] = { ...stats[i], value: e.target.value };
                              setAbout({
                                ...about,
                                main: { ...about.main, stats },
                              });
                            }}
                          />
                          <input
                            className={`${scInput} min-w-[200px] flex-1`}
                            value={row.label}
                            onChange={(e) => {
                              const stats = [...about.main.stats];
                              stats[i] = { ...stats[i], label: e.target.value };
                              setAbout({
                                ...about,
                                main: { ...about.main, stats },
                              });
                            }}
                          />
                          <DangerMini
                            onClick={() => {
                              const stats = about.main.stats.filter(
                                (_, j) => j !== i,
                              );
                              setAbout({
                                ...about,
                                main: { ...about.main, stats },
                              });
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
                              stats: [
                                ...about.main.stats,
                                { value: "", label: "" },
                              ],
                            },
                          })
                        }
                      >
                        + {t.siteContent.common.addRow}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("about")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.about.label)}
                  </PrimarySave>
                </EditorBody>
              ) : tab === "services" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "svc-header", label: t.siteContent.services.sections.header },
                    { id: "svc-features", label: t.siteContent.services.sections.features },
                    { id: "svc-banner", label: t.siteContent.services.sections.banner },
                  ]}
                >
                  <EditorSection
                    id="svc-header"
                    title={t.siteContent.services.fields.title}
                    subtitle={t.siteContent.services.fields.subtitle}
                  >
                    <div className="grid gap-4 lg:grid-cols-3">
                      {(
                        [
                          ["badge", t.siteContent.services.fields.badge],
                          ["h2Line1", t.siteContent.services.fields.h2Line1],
                          ["h2Accent", t.siteContent.services.fields.h2Accent],
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
                                header: {
                                  ...services.header,
                                  [key]: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {t.siteContent.services.fields.intro}
                      </label>
                      <textarea
                        className={scTextarea("min-h-[80px]")}
                        value={services.header.intro}
                        onChange={(e) =>
                          setServices({
                            ...services,
                            header: {
                              ...services.header,
                              intro: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="svc-features"
                    title={t.siteContent.services.sections.features}
                    subtitle="max 4"
                    defaultOpen={false}
                  >
                    <div className="space-y-4">
                      {services.features.map((f, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <input
                            className={scInput}
                            placeholder={t.siteContent.common.title}
                            value={f.title}
                            onChange={(e) => {
                              const features = [...services.features];
                              features[i] = {
                                ...features[i],
                                title: e.target.value,
                              };
                              setServices({ ...services, features });
                            }}
                          />
                          <textarea
                            className={`mt-2 ${scTextarea("min-h-[72px]")}`}
                            placeholder={t.siteContent.common.description}
                            value={f.desc}
                            onChange={(e) => {
                              const features = [...services.features];
                              features[i] = {
                                ...features[i],
                                desc: e.target.value,
                              };
                              setServices({ ...services, features });
                            }}
                          />
                          <DangerMini
                            className="mt-2"
                            onClick={() =>
                              setServices({
                                ...services,
                                features: services.features.filter(
                                  (_, j) => j !== i,
                                ),
                              })
                            }
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() =>
                          setServices({
                            ...services,
                            features: [
                              ...services.features,
                              { title: "", desc: "" },
                            ],
                          })
                        }
                      >
                        + {t.siteContent.common.add}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="svc-banner"
                    title={t.siteContent.services.sections.banner}
                    subtitle={t.siteContent.services.fields.subtitle}
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      {services.banner.map((row, i) => (
                        <div key={i} className="flex flex-wrap gap-2">
                          <input
                            className={`${scInput} max-w-[100px]`}
                            placeholder={t.siteContent.common.placeholder}
                            value={row.value}
                            onChange={(e) => {
                              const banner = [...services.banner];
                              banner[i] = {
                                ...banner[i],
                                value: e.target.value,
                              };
                              setServices({ ...services, banner });
                            }}
                          />
                          <input
                            className={`${scInput} max-w-[80px]`}
                            placeholder="Suffix"
                            value={row.suffix}
                            onChange={(e) => {
                              const banner = [...services.banner];
                              banner[i] = {
                                ...banner[i],
                                suffix: e.target.value,
                              };
                              setServices({ ...services, banner });
                            }}
                          />
                          <input
                            className={`${scInput} min-w-[180px] flex-1`}
                            placeholder={t.siteContent.common.label}
                            value={row.label}
                            onChange={(e) => {
                              const banner = [...services.banner];
                              banner[i] = {
                                ...banner[i],
                                label: e.target.value,
                              };
                              setServices({ ...services, banner });
                            }}
                          />
                          <DangerMini
                            onClick={() =>
                              setServices({
                                ...services,
                                banner: services.banner.filter(
                                  (_, j) => j !== i,
                                ),
                              })
                            }
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() =>
                          setServices({
                            ...services,
                            banner: [
                              ...services.banner,
                              { value: "", suffix: "", label: "" },
                            ],
                          })
                        }
                      >
                        + Баннер мөр нэмэх
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("services")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.services.label)}
                  </PrimarySave>
                </EditorBody>
              ) : tab === "contact" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "contact-hero", label: t.siteContent.contact.sections.hero },
                    { id: "contact-items", label: t.siteContent.contact.sections.items },
                    { id: "contact-agent", label: t.siteContent.contact.sections.agent },
                    { id: "contact-form", label: t.siteContent.contact.sections.form },
                  ]}
                >
                  <EditorSection
                    id="contact-hero"
                    title={t.siteContent.contact.fields.heroTitle}
                    subtitle={t.siteContent.contact.fields.heroSubtitle}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      {(
                        [
                          ["badge", t.siteContent.contact.fields.badge],
                          ["h2Accent", t.siteContent.contact.fields.h2Accent],
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
                                hero: {
                                  ...contact.hero,
                                  [key]: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {t.siteContent.contact.fields.intro}
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
                  <EditorSection
                    id="contact-items"
                    title={t.siteContent.contact.fields.infoItems}
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      {contact.items.map((row, i) => (
                        <div key={i} className="flex flex-wrap gap-2">
                          <input
                            className={`${scInput} max-w-[160px]`}
                            placeholder={t.siteContent.common.title}
                            value={row.title}
                            onChange={(e) => {
                              const items = [...contact.items];
                              items[i] = { ...items[i], title: e.target.value };
                              setContact({ ...contact, items });
                            }}
                          />
                          <input
                            className={`${scInput} min-w-[200px] flex-1`}
                            placeholder={t.siteContent.common.placeholder}
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
                            {t.siteContent.common.remove}
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
                        + {t.siteContent.common.addRow}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="contact-agent"
                    title={t.siteContent.contact.fields.agentTitle}
                    defaultOpen={false}
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(
                        [
                          ["initials", t.siteContent.contact.fields.initials],
                          ["name", t.siteContent.contact.fields.name],
                          ["role", t.siteContent.contact.fields.role],
                          ["telHref", t.siteContent.contact.fields.telHref],
                          ["telLabel", t.siteContent.contact.fields.telLabel],
                        ] as const
                      ).map(([key, lab]) => (
                        <div
                          key={key}
                          className={
                            key === "role" ? "sm:col-span-2 lg:col-span-3" : ""
                          }
                        >
                          <label className="text-xs text-zinc-500">{lab}</label>
                          <input
                            className={scInput}
                            value={contact.agent[key]}
                            onChange={(e) =>
                              setContact({
                                ...contact,
                                agent: {
                                  ...contact.agent,
                                  [key]: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </EditorSection>
                  <EditorSection id="contact-form" title={t.siteContent.contact.fields.formTitle}>
                    <input
                      className={scInput}
                      value={contact.formTitle}
                      onChange={(e) =>
                        setContact({ ...contact, formTitle: e.target.value })
                      }
                    />
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("contact")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.contact.label)}
                  </PrimarySave>
                </EditorBody>
              ) : tab === "properties-page" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "properties-header", label: t.siteContent.propertiesPage.sections.header },
                    { id: "properties-categories", label: t.siteContent.propertiesPage.sections.categories },
                    { id: "properties-items", label: t.siteContent.propertiesPage.sections.items },
                    { id: "properties-cta", label: t.siteContent.propertiesPage.sections.cta },
                  ]}
                >
                  <EditorSection
                    id="properties-header"
                    title={t.siteContent.propertiesPage.fields.headerTitle}
                    subtitle={t.siteContent.propertiesPage.fields.headerSubtitle}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.propertiesPage.fields.headerBadge}
                        </label>
                        <input
                          className={scInput}
                          value={propertiesPage.header.badge}
                          onChange={(e) =>
                            setPropertiesPage({
                              ...propertiesPage,
                              header: {
                                ...propertiesPage.header,
                                badge: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.propertiesPage.fields.titleLine1}
                        </label>
                        <input
                          className={scInput}
                          value={propertiesPage.header.titleLine1}
                          onChange={(e) =>
                            setPropertiesPage({
                              ...propertiesPage,
                              header: {
                                ...propertiesPage.header,
                                titleLine1: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.propertiesPage.fields.titleAccent}
                        </label>
                        <input
                          className={scInput}
                          value={propertiesPage.header.titleAccent}
                          onChange={(e) =>
                            setPropertiesPage({
                              ...propertiesPage,
                              header: {
                                ...propertiesPage.header,
                                titleAccent: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.propertiesPage.fields.intro}
                        </label>
                        <textarea
                          className={scTextarea("min-h-[90px]")}
                          value={propertiesPage.header.intro}
                          onChange={(e) =>
                            setPropertiesPage({
                              ...propertiesPage,
                              header: {
                                ...propertiesPage.header,
                                intro: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="properties-categories"
                    title={t.siteContent.propertiesPage.fields.categoriesTitle}
                    subtitle={t.siteContent.propertiesPage.fields.categoriesHint}
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      {propertiesPage.categories.map((row, i) => (
                        <div key={i} className="flex flex-wrap gap-2">
                          <input
                            className={`${scInput} min-w-[220px] flex-1`}
                            value={row}
                            onChange={(e) => {
                              const categories = [...propertiesPage.categories];
                              categories[i] = e.target.value;
                              setPropertiesPage({
                                ...propertiesPage,
                                categories,
                              });
                            }}
                          />
                          <DangerMini
                            onClick={() =>
                              setPropertiesPage({
                                ...propertiesPage,
                                categories: propertiesPage.categories.filter(
                                  (_, j) => j !== i,
                                ),
                              })
                            }
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() =>
                          setPropertiesPage({
                            ...propertiesPage,
                            categories: [...propertiesPage.categories, ""],
                          })
                        }
                      >
                        + {t.siteContent.common.add}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="properties-items"
                    title={t.siteContent.propertiesPage.fields.itemsTitle}
                    subtitle="Properties list"
                    defaultOpen={false}
                  >
                    <div className="space-y-4">
                      {propertiesPage.items.map((item, i) => (
                        <div
                          key={item.id || i}
                          className="rounded-xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.id}
                              </label>
                              <input
                                type="number"
                                className={scInput}
                                value={item.id}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    id: Number(e.target.value) || 0,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.name}
                              </label>
                              <input
                                className={scInput}
                                value={item.name}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    name: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <ImageUploadField
                                previewFit="cover"
                                value={item.image}
                                onChange={(next) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = { ...items[i], image: next };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.category}
                              </label>
                              <input
                                className={scInput}
                                value={item.category}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    category: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.itemBadge}
                              </label>
                              <input
                                className={scInput}
                                placeholder="Хоосон бол харуулахгүй"
                                value={item.badge ?? ""}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    badge: e.target.value.trim() || null,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.tag}
                              </label>
                              <input
                                className={scInput}
                                value={item.tag}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    tag: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.size}
                              </label>
                              <input
                                className={scInput}
                                value={item.size}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    size: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.floor}
                              </label>
                              <input
                                className={scInput}
                                value={item.floor}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    floor: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.parking}
                              </label>
                              <input
                                className={scInput}
                                value={item.parking}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    parking: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.price}
                              </label>
                              <input
                                className={scInput}
                                value={item.price}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    price: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <label className="text-xs text-zinc-500">
                                {t.siteContent.propertiesPage.fields.description}
                              </label>
                              <textarea
                                className={scTextarea("min-h-[80px]")}
                                value={item.description}
                                onChange={(e) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = {
                                    ...items[i],
                                    description: e.target.value,
                                  };
                                  setPropertiesPage({
                                    ...propertiesPage,
                                    items,
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <DangerMini
                              onClick={() =>
                                setPropertiesPage({
                                  ...propertiesPage,
                                  items: propertiesPage.items.filter(
                                    (_, j) => j !== i,
                                  ),
                                })
                              }
                            >
                              {t.siteContent.common.remove}
                            </DangerMini>
                          </div>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() =>
                          setPropertiesPage({
                            ...propertiesPage,
                            items: [
                              ...propertiesPage.items,
                              {
                                id: Date.now(),
                                name: "",
                                image: "",
                                category: "",
                                badge: null,
                                size: "",
                                floor: "",
                                parking: "",
                                price: "",
                                tag: "",
                                description: "",
                              },
                            ],
                          })
                        }
                      >
                        + {t.siteContent.common.add}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <EditorSection id="properties-cta" title={t.siteContent.propertiesPage.sections.cta}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.propertiesPage.fields.href}
                        </label>
                        <input
                          className={scInput}
                          value={propertiesPage.cta.href}
                          onChange={(e) =>
                            setPropertiesPage({
                              ...propertiesPage,
                              cta: {
                                ...propertiesPage.cta,
                                href: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.propertiesPage.fields.label}
                        </label>
                        <input
                          className={scInput}
                          value={propertiesPage.cta.label}
                          onChange={(e) =>
                            setPropertiesPage({
                              ...propertiesPage,
                              cta: {
                                ...propertiesPage.cta,
                                label: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("properties-page")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.propertiesPage.label)}
                  </PrimarySave>
                </EditorBody>
              ) : tab === "sales-page" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "sales-meta", label: t.siteContent.salesPage.fields.title },
                    { id: "sales-intro", label: t.siteContent.salesPage.fields.intro },
                  ]}
                >
                  <EditorSection id="sales-meta" title={t.siteContent.salesPage.fields.headerTitle}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.salesPage.fields.eyebrow}
                        </label>
                        <input
                          className={scInput}
                          value={salesPage.header.eyebrow}
                          onChange={(e) =>
                            setSalesPage({
                              ...salesPage,
                              header: {
                                ...salesPage.header,
                                eyebrow: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          {t.siteContent.salesPage.fields.title}
                        </label>
                        <input
                          className={scInput}
                          value={salesPage.header.title}
                          onChange={(e) =>
                            setSalesPage({
                              ...salesPage,
                              header: {
                                ...salesPage.header,
                                title: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </EditorSection>
                  <EditorSection id="sales-intro" title={t.siteContent.salesPage.fields.intro}>
                    <textarea
                      className={scTextarea("min-h-[100px]")}
                      value={salesPage.header.intro}
                      onChange={(e) =>
                        setSalesPage({
                          ...salesPage,
                          header: {
                            ...salesPage.header,
                            intro: e.target.value,
                          },
                        })
                      }
                    />
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("sales-page")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.salesPage.label)}
                  </PrimarySave>
                </EditorBody>
              ) : tab === "jobs-page" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "jobs-header-title", label: t.siteContent.jobsPage.fields.title },
                    { id: "jobs-header-intro", label: t.siteContent.jobsPage.fields.intro },
                  ]}
                >
                  <EditorSection id="jobs-header-title" title={t.siteContent.jobsPage.fields.headerTitle}>
                    <input
                      className={scInput}
                      value={jobsPage.header.title}
                      onChange={(e) =>
                        setJobsPage({
                          ...jobsPage,
                          header: { ...jobsPage.header, title: e.target.value },
                        })
                      }
                    />
                  </EditorSection>
                  <EditorSection id="jobs-header-intro" title="Дэд тайлбар">
                    <textarea
                      className={scTextarea("min-h-[80px]")}
                      value={jobsPage.header.intro}
                      onChange={(e) =>
                        setJobsPage({
                          ...jobsPage,
                          header: { ...jobsPage.header, intro: e.target.value },
                        })
                      }
                    />
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("jobs-page")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.jobsPage.label)}
                  </PrimarySave>
                </EditorBody>
              ) : tab === "team" ? (
                <EditorBody
                  sectionJumpKey={tab}
                  sectionItems={[
                    { id: "team-header", label: t.siteContent.team.sections.header },
                    { id: "team-members", label: t.siteContent.team.sections.members },
                    { id: "team-cta", label: t.siteContent.team.sections.cta },
                  ]}
                >
                  <EditorSection
                    id="team-header"
                    title={t.siteContent.team.fields.headerTitle}
                    subtitle={t.siteContent.team.fields.headerSubtitle}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Дээд шошго
                        </label>
                        <input
                          className={scInput}
                          value={teamPage.header.eyebrow}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              header: {
                                ...teamPage.header,
                                eyebrow: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Гарчиг (эхний хэсэг)
                        </label>
                        <input
                          className={scInput}
                          value={teamPage.header.h2Line1}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              header: {
                                ...teamPage.header,
                                h2Line1: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Гарчиг (онцлох өнгө)
                        </label>
                        <input
                          className={scInput}
                          value={teamPage.header.h2Accent}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              header: {
                                ...teamPage.header,
                                h2Accent: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Танилцуулга
                        </label>
                        <textarea
                          className={scTextarea("min-h-[80px]")}
                          value={teamPage.header.intro}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              header: {
                                ...teamPage.header,
                                intro: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="team-members"
                    title="Багийн гишүүд"
                    defaultOpen={false}
                  >
                    <div className="space-y-4">
                      {teamPage.members.map((m, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                        >
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <label className="text-xs text-zinc-500">
                                Нэр
                              </label>
                              <input
                                className={scInput}
                                value={m.name}
                                onChange={(e) => {
                                  const members = [...teamPage.members];
                                  members[i] = {
                                    ...members[i],
                                    name: e.target.value,
                                  };
                                  setTeamPage({ ...teamPage, members });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                Албан тушаал
                              </label>
                              <input
                                className={scInput}
                                value={m.role}
                                onChange={(e) => {
                                  const members = [...teamPage.members];
                                  members[i] = {
                                    ...members[i],
                                    role: e.target.value,
                                  };
                                  setTeamPage({ ...teamPage, members });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                Эхний үсэг
                              </label>
                              <input
                                className={scInput}
                                value={m.initials}
                                onChange={(e) => {
                                  const members = [...teamPage.members];
                                  members[i] = {
                                    ...members[i],
                                    initials: e.target.value,
                                  };
                                  setTeamPage({ ...teamPage, members });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                Утас
                              </label>
                              <input
                                className={scInput}
                                value={m.phone}
                                onChange={(e) => {
                                  const members = [...teamPage.members];
                                  members[i] = {
                                    ...members[i],
                                    phone: e.target.value,
                                  };
                                  setTeamPage({ ...teamPage, members });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                Имэйл
                              </label>
                              <input
                                className={scInput}
                                value={m.email}
                                onChange={(e) => {
                                  const members = [...teamPage.members];
                                  members[i] = {
                                    ...members[i],
                                    email: e.target.value,
                                  };
                                  setTeamPage({ ...teamPage, members });
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-500">
                                Төслүүд (тоо)
                              </label>
                              <input
                                type="number"
                                className={scInput}
                                value={m.projects}
                                onChange={(e) => {
                                  const members = [...teamPage.members];
                                  members[i] = {
                                    ...members[i],
                                    projects: Number(e.target.value) || 0,
                                  };
                                  setTeamPage({ ...teamPage, members });
                                }}
                              />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <label className="text-xs text-zinc-500">
                                Тайлбар
                              </label>
                              <textarea
                                className={scTextarea("min-h-[72px]")}
                                value={m.bio}
                                onChange={(e) => {
                                  const members = [...teamPage.members];
                                  members[i] = {
                                    ...members[i],
                                    bio: e.target.value,
                                  };
                                  setTeamPage({ ...teamPage, members });
                                }}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <DangerMini
                              onClick={() =>
                                setTeamPage({
                                  ...teamPage,
                                  members: teamPage.members.filter(
                                    (_, j) => j !== i,
                                  ),
                                })
                              }
                            >
                              Устгах
                            </DangerMini>
                          </div>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() =>
                          setTeamPage({
                            ...teamPage,
                            members: [
                              ...teamPage.members,
                              {
                                name: "",
                                role: "",
                                initials: "",
                                color: "bg-accent-500",
                                phone: "",
                                email: "",
                                bio: "",
                                projects: 0,
                              },
                            ],
                          })
                        }
                      >
                        + Гишүүн нэмэх
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <EditorSection id="team-cta" title="Доод урилга (CTA)">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="lg:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Гарчиг
                        </label>
                        <input
                          className={scInput}
                          value={teamPage.cta.title}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              cta: { ...teamPage.cta, title: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Дэд текст
                        </label>
                        <textarea
                          className={scTextarea("min-h-[60px]")}
                          value={teamPage.cta.subtitle}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              cta: {
                                ...teamPage.cta,
                                subtitle: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Товчны текст
                        </label>
                        <input
                          className={scInput}
                          value={teamPage.cta.buttonLabel}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              cta: {
                                ...teamPage.cta,
                                buttonLabel: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Холбоос (ж: /contact)
                        </label>
                        <input
                          className={scInput}
                          value={teamPage.cta.buttonHref}
                          onChange={(e) =>
                            setTeamPage({
                              ...teamPage,
                              cta: {
                                ...teamPage.cta,
                                buttonHref: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("team")}
                  >
                    {saving ? "Хадгалж байна…" : "Мэдээ мэдээлэл хадгалах"}
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
                              partners: {
                                ...footer.partners,
                                partnersLabel: e.target.value,
                              },
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
                              <label className="text-xs text-zinc-500">
                                Нэр
                              </label>
                              <input
                                className={scInput}
                                value={row.name}
                                onChange={(e) => {
                                  const items = [...footer.partners.items];
                                  items[i] = {
                                    ...items[i],
                                    name: e.target.value,
                                  };
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
                              <label className="text-xs text-zinc-500">
                                Өргөн
                              </label>
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
                              <label className="text-xs text-zinc-500">
                                Өндөр
                              </label>
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
                                const items = footer.partners.items.filter(
                                  (_, j) => j !== i,
                                );
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
                                {
                                  name: "",
                                  src: "/logos/ing.svg",
                                  width: 100,
                                  height: 36,
                                },
                              ],
                            },
                          })
                        }
                      >
                        + Түнш нэмэх
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("footer")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.footer.label)}
                  </PrimarySave>
                </EditorBody>
              )}
            </div>
          </EditorSurface>
        </div>
      </div>
    </div>
  );
}
