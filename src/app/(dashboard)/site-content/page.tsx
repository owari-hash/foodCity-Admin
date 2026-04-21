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
  DualInput,
  DualTextarea,
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
  const [homeEN, setHomeEN] = useState<HomeState>(EMPTY_HOME);

  const [about, setAbout] = useState<AboutState>(EMPTY_ABOUT);
  const [aboutEN, setAboutEN] = useState<AboutState>(EMPTY_ABOUT);

  const [footer, setFooter] = useState<FooterState>(EMPTY_FOOTER);
  const [footerEN, setFooterEN] = useState<FooterState>(EMPTY_FOOTER);

  const [contact, setContact] = useState<ContactState>(EMPTY_CONTACT);
  const [contactEN, setContactEN] = useState<ContactState>(EMPTY_CONTACT);

  const [services, setServices] = useState<ServicesState>(EMPTY_SERVICES);
  const [servicesEN, setServicesEN] = useState<ServicesState>(EMPTY_SERVICES);

  const [propertiesPage, setPropertiesPage] = useState<PropertiesPageState>(
    EMPTY_PROPERTIES_PAGE,
  );
  const [propertiesPageEN, setPropertiesPageEN] = useState<PropertiesPageState>(
    EMPTY_PROPERTIES_PAGE,
  );

  const [salesPage, setSalesPage] = useState<SalesPageState>(EMPTY_SALES_PAGE);
  const [salesPageEN, setSalesPageEN] = useState<SalesPageState>(EMPTY_SALES_PAGE);

  const [jobsPage, setJobsPage] = useState<JobsPageState>(EMPTY_JOBS_PAGE);
  const [jobsPageEN, setJobsPageEN] = useState<JobsPageState>(EMPTY_JOBS_PAGE);

  const [teamPage, setTeamPage] = useState<TeamPageState>(EMPTY_TEAM_PAGE);
  const [teamPageEN, setTeamPageEN] = useState<TeamPageState>(EMPTY_TEAM_PAGE);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const allPages = [
        "home",
        "about",
        "services",
        "contact",
        "properties-page",
        "sales-page",
        "jobs-page",
        "team",
        "footer",
      ];
      const [mnResults, enResults] = await Promise.all([
        Promise.all(allPages.map((p) => fetchSections(p, "mn"))),
        Promise.all(allPages.map((p) => fetchSections(p, "en"))),
      ]);

      const [hMN, aMN, svcMN, cMN, ppMN, spMN, jpMN, tmMN, fMN] = mnResults;
      const [hEN, aEN, svcEN, cEN, ppEN, spEN, jpEN, tmEN, fEN] = enResults;

      setHome(normalizeHome(hMN));
      setHomeEN(normalizeHome(hEN));

      setAbout(normalizeAbout(aMN));
      setAboutEN(normalizeAbout(aEN));

      setServices(normalizeServices(svcMN));
      setServicesEN(normalizeServices(svcEN));

      setContact(normalizeContact(cMN));
      setContactEN(normalizeContact(cEN));

      setPropertiesPage(normalizePropertiesPage(ppMN));
      setPropertiesPageEN(normalizePropertiesPage(ppEN));

      setSalesPage(normalizeSalesPage(spMN));
      setSalesPageEN(normalizeSalesPage(spEN));

      setJobsPage(normalizeJobsPage(jpMN));
      setJobsPageEN(normalizeJobsPage(jpEN));

      setTeamPage(normalizeTeamPage(tmMN));
      setTeamPageEN(normalizeTeamPage(tmEN));

      setFooter(normalizeFooter(fMN));
      setFooterEN(normalizeFooter(fEN));
    } catch (e) {
      if (e instanceof Error && e.message === "FC_FORBIDDEN") {
        setError(t.siteContent.common.forbidden);
      } else {
        setError(e instanceof Error ? e.message : t.siteContent.common.error);
      }
    } finally {
      setLoading(false);
    }
  }, [t.siteContent.common.error, t.siteContent.common.forbidden]);

  const debouncedSave = useDebounce(
    async (pageId: (typeof TABS)[number]["id"], sections: unknown, targetLang?: string) => {
      setError(null);
      setSaved(null);
      setSaving(true);

      try {
        const res = await fetch(
          joinBackendRequestUrl(
            getApiBaseUrl(),
            `/api/v1/admin/site-pages/${pageId}?lang=${targetLang || lang}`,
          ),
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
    const mnSections =
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

    const enSections =
      pageId === "home"
        ? homeEN
        : pageId === "about"
          ? aboutEN
          : pageId === "services"
            ? servicesEN
            : pageId === "contact"
              ? contactEN
              : pageId === "properties-page"
                ? propertiesPageEN
                : pageId === "sales-page"
                  ? salesPageEN
                  : pageId === "jobs-page"
                    ? jobsPageEN
                    : pageId === "team"
                      ? teamPageEN
                      : footerEN;

    try {
      await Promise.all([
        fetch(
          joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/site-pages/${pageId}?lang=mn`),
          withClientAdminAuth({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sections: mnSections }),
          }),
        ),
        fetch(
          joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/site-pages/${pageId}?lang=en`),
          withClientAdminAuth({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sections: enSections }),
          }),
        ),
      ]);

      const rev = await fetch("/api/revalidate-front", { method: "POST" });
      if (!rev.ok) {
        const t2 = await rev.text();
        console.warn("revalidate-front:", t2);
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
                    <div className="space-y-4">
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
                        <DualInput
                          key={key}
                          label={lab}
                          mnValue={home.hero[key] as string}
                          enValue={homeEN.hero[key] as string}
                          onChangeMN={(v) => {
                            setHome({
                              ...home,
                              hero: { ...home.hero, [key]: v },
                            });
                          }}
                          onChangeEN={(v) => {
                            setHomeEN({
                              ...homeEN,
                              hero: { ...homeEN.hero, [key]: v },
                            });
                          }}
                        />
                      ))}
                    </div>
                  </EditorSection>
                  <EditorSection id="home-desc" title={t.siteContent.home.sections.desc}>
                    <DualTextarea
                      label={t.siteContent.home.sections.desc}
                      mnValue={home.hero.desc}
                      enValue={homeEN.hero.desc}
                      onChangeMN={(v) =>
                        setHome({
                          ...home,
                          hero: { ...home.hero, desc: v },
                        })
                      }
                      onChangeEN={(v) =>
                        setHomeEN({
                          ...homeEN,
                          hero: { ...homeEN.hero, desc: v },
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
                    <div className="space-y-4">
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
                        <DualInput
                          key={key}
                          label={lab}
                          mnValue={about.main[key] as string}
                          enValue={aboutEN.main[key] as string}
                          onChangeMN={(v) =>
                            setAbout({
                              ...about,
                              main: { ...about.main, [key]: v },
                            })
                          }
                          onChangeEN={(v) =>
                            setAboutEN({
                              ...aboutEN,
                              main: { ...aboutEN.main, [key]: v },
                            })
                          }
                        />
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
                    <div className="space-y-4">
                      <DualTextarea
                        label={`${t.siteContent.about.sections.copy} 1`}
                        mnValue={about.main.p1}
                        enValue={aboutEN.main.p1}
                        onChangeMN={(v) => setAbout({ ...about, main: { ...about.main, p1: v } })}
                        onChangeEN={(v) => setAboutEN({ ...aboutEN, main: { ...aboutEN.main, p1: v } })}
                      />
                      <DualTextarea
                        label={`${t.siteContent.about.sections.copy} 2`}
                        mnValue={about.main.p2}
                        enValue={aboutEN.main.p2}
                        onChangeMN={(v) => setAbout({ ...about, main: { ...about.main, p2: v } })}
                        onChangeEN={(v) => setAboutEN({ ...aboutEN, main: { ...aboutEN.main, p2: v } })}
                      />
                    </div>
                  </EditorSection>
                  <EditorSection
                    id="about-stats"
                    title={t.siteContent.about.sections.stats}
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      {about.main.stats.map((row, i) => (
                        <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800/40 dark:bg-slate-900/20">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {lang === "mn" ? "Утга" : "Value"}
                            </label>
                            <input
                              className={`${scInput} max-w-[120px]`}
                              value={row.value}
                              onChange={(e) => {
                                const v = e.target.value;
                                const s = [...about.main.stats];
                                s[i] = { ...s[i], value: v };
                                setAbout({ ...about, main: { ...about.main, stats: s } });
                                
                                const sEN = [...aboutEN.main.stats];
                                if (sEN[i]) {
                                  sEN[i] = { ...sEN[i], value: v };
                                  setAboutEN({ ...aboutEN, main: { ...aboutEN.main, stats: sEN } });
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <DualInput
                              label={lang === "mn" ? "Шошго" : "Label"}
                              mnValue={row.label}
                              enValue={aboutEN.main.stats[i]?.label ?? ""}
                              onChangeMN={(v) => {
                                const s = [...about.main.stats];
                                s[i] = { ...s[i], label: v };
                                setAbout({ ...about, main: { ...about.main, stats: s } });
                              }}
                              onChangeEN={(v) => {
                                const s = [...aboutEN.main.stats];
                                if (!s[i]) s[i] = { label: "", value: row.value };
                                s[i] = { ...s[i], label: v };
                                setAboutEN({ ...aboutEN, main: { ...aboutEN.main, stats: s } });
                              }}
                            />
                          </div>
                          <DangerMini
                            onClick={() => {
                              setAbout({
                                ...about,
                                main: { ...about.main, stats: about.main.stats.filter((_, j) => j !== i) },
                              });
                              setAboutEN({
                                ...aboutEN,
                                main: { ...aboutEN.main, stats: aboutEN.main.stats.filter((_, j) => j !== i) },
                              });
                            }}
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() => {
                          const newItem = { value: "", label: "" };
                          setAbout({
                            ...about,
                            main: { ...about.main, stats: [...about.main.stats, newItem] },
                          });
                          setAboutEN({
                            ...aboutEN,
                            main: { ...aboutEN.main, stats: [...aboutEN.main.stats, newItem] },
                          });
                        }}
                      >
                        + {lang === "mn" ? "Мөр нэмэх" : "Add Row"}
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
                    <div className="space-y-4">
                      {(
                        [
                          ["badge", t.siteContent.services.fields.badge],
                          ["h2Line1", t.siteContent.services.fields.h2Line1],
                          ["h2Accent", t.siteContent.services.fields.h2Accent],
                        ] as const
                      ).map(([key, lab]) => (
                        <DualInput
                          key={key}
                          label={lab}
                          mnValue={services.header[key]}
                          enValue={servicesEN.header[key]}
                          onChangeMN={(v) =>
                            setServices({
                              ...services,
                              header: { ...services.header, [key]: v },
                            })
                          }
                          onChangeEN={(v) =>
                            setServicesEN({
                              ...servicesEN,
                              header: { ...servicesEN.header, [key]: v },
                            })
                          }
                        />
                      ))}
                    </div>
                    <div className="mt-4">
                      <DualTextarea
                        label={t.siteContent.services.fields.intro}
                        mnValue={services.header.intro}
                        enValue={servicesEN.header.intro}
                        onChangeMN={(v) =>
                          setServices({
                            ...services,
                            header: { ...services.header, intro: v },
                          })
                        }
                        onChangeEN={(v) =>
                          setServicesEN({
                            ...servicesEN,
                            header: { ...servicesEN.header, intro: v },
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
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Feature #{i+1}</span>
                             <DangerMini
                              onClick={() => {
                                setServices({
                                  ...services,
                                  features: services.features.filter((_, j) => j !== i),
                                });
                                setServicesEN({
                                  ...servicesEN,
                                  features: servicesEN.features.filter((_, j) => j !== i),
                                });
                              }}
                            >
                              {t.siteContent.common.remove}
                            </DangerMini>
                          </div>
                          <div className="space-y-4">
                            <DualInput
                              label={t.siteContent.common.title}
                              mnValue={f.title}
                              enValue={servicesEN.features[i]?.title ?? ""}
                              onChangeMN={(v) => {
                                const features = [...services.features];
                                features[i] = { ...features[i], title: v };
                                setServices({ ...services, features });
                              }}
                              onChangeEN={(v) => {
                                const features = [...servicesEN.features];
                                if (!features[i]) features[i] = { title: "", desc: "" };
                                features[i] = { ...features[i], title: v };
                                setServicesEN({ ...servicesEN, features });
                              }}
                            />
                            <DualTextarea
                              label={t.siteContent.common.description}
                              mnValue={f.desc}
                              enValue={servicesEN.features[i]?.desc ?? ""}
                              onChangeMN={(v) => {
                                const features = [...services.features];
                                features[i] = { ...features[i], desc: v };
                                setServices({ ...services, features });
                              }}
                              onChangeEN={(v) => {
                                const features = [...servicesEN.features];
                                if (!features[i]) features[i] = { title: "", desc: "" };
                                features[i] = { ...features[i], desc: v };
                                setServicesEN({ ...servicesEN, features });
                              }}
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() => {
                          const newItem = { title: "", desc: "" };
                          setServices({
                            ...services,
                            features: [...services.features, newItem],
                          });
                          setServicesEN({
                             ...servicesEN,
                             features: [...servicesEN.features, newItem],
                          });
                        }}
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
                        <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800/40 dark:bg-slate-900/20">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Value</label>
                            <input
                              className={`${scInput} max-w-[80px]`}
                              value={row.value}
                              onChange={(e) => {
                                const v = e.target.value;
                                const b = [...services.banner];
                                b[i] = { ...b[i], value: v };
                                setServices({ ...services, banner: b });
                                const bEN = [...servicesEN.banner];
                                if (bEN[i]) {
                                  bEN[i] = { ...bEN[i], value: v };
                                  setServicesEN({ ...servicesEN, banner: bEN });
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suffix</label>
                            <input
                              className={`${scInput} max-w-[80px]`}
                              placeholder="Suffix"
                              value={row.suffix}
                              onChange={(e) => {
                                const v = e.target.value;
                                const b = [...services.banner];
                                b[i] = { ...b[i], suffix: v };
                                setServices({ ...services, banner: b });
                                const bEN = [...servicesEN.banner];
                                if (bEN[i]) {
                                  bEN[i] = { ...bEN[i], suffix: v };
                                  setServicesEN({ ...servicesEN, banner: bEN });
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <DualInput
                              label={t.siteContent.common.label}
                              mnValue={row.label}
                              enValue={servicesEN.banner[i]?.label ?? ""}
                              onChangeMN={(v) => {
                                const b = [...services.banner];
                                b[i] = { ...b[i], label: v };
                                setServices({ ...services, banner: b });
                              }}
                              onChangeEN={(v) => {
                                const b = [...servicesEN.banner];
                                if (!b[i]) b[i] = { value: row.value, suffix: row.suffix, label: "" };
                                b[i] = { ...b[i], label: v };
                                setServicesEN({ ...servicesEN, banner: b });
                              }}
                            />
                          </div>
                          <DangerMini
                            onClick={() => {
                              setServices({
                                ...services,
                                banner: services.banner.filter((_, j) => j !== i),
                              });
                              setServicesEN({
                                ...servicesEN,
                                banner: servicesEN.banner.filter((_, j) => j !== i),
                              });
                            }}
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() => {
                          const newItem = { value: "", suffix: "", label: "" };
                          setServices({
                            ...services,
                            banner: [...services.banner, newItem],
                          });
                          setServicesEN({
                            ...servicesEN,
                            banner: [...servicesEN.banner, newItem],
                          });
                        }}
                      >
                        + {lang === "mn" ? "Баннер мөр нэмэх" : "Add Banner Row"}
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
                    <div className="space-y-4">
                      {(
                        [
                          ["badge", t.siteContent.contact.fields.badge],
                          ["h2Accent", t.siteContent.contact.fields.h2Accent],
                        ] as const
                      ).map(([key, lab]) => (
                        <DualInput
                          key={key}
                          label={lab}
                          mnValue={contact.hero[key]}
                          enValue={contactEN.hero[key]}
                          onChangeMN={(v) => setContact({ ...contact, hero: { ...contact.hero, [key]: v } })}
                          onChangeEN={(v) => setContactEN({ ...contactEN, hero: { ...contactEN.hero, [key]: v } })}
                        />
                      ))}
                      <DualTextarea
                        label={t.siteContent.contact.fields.intro}
                        mnValue={contact.hero.intro}
                        enValue={contactEN.hero.intro}
                        onChangeMN={(v) => setContact({ ...contact, hero: { ...contact.hero, intro: v } })}
                        onChangeEN={(v) => setContactEN({ ...contactEN, hero: { ...contactEN.hero, intro: v } })}
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
                        <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800/40 dark:bg-slate-900/20">
                          <div className="flex-1">
                            <DualInput
                              label={t.siteContent.common.title}
                              mnValue={row.title}
                              enValue={contactEN.items[i]?.title ?? ""}
                              onChangeMN={(v) => {
                                const items = [...contact.items];
                                items[i] = { ...items[i], title: v };
                                setContact({ ...contact, items });
                              }}
                              onChangeEN={(v) => {
                                const items = [...contactEN.items];
                                if (!items[i]) items[i] = { title: "", value: row.value };
                                items[i] = { ...items[i], title: v };
                                setContactEN({ ...contactEN, items });
                              }}
                            />
                          </div>
                          <div className="flex-1">
                             <DualInput
                              label={t.siteContent.common.placeholder}
                              mnValue={row.value}
                              enValue={contactEN.items[i]?.value ?? ""}
                              onChangeMN={(v) => {
                                const items = [...contact.items];
                                items[i] = { ...items[i], value: v };
                                setContact({ ...contact, items });
                              }}
                              onChangeEN={(v) => {
                                const items = [...contactEN.items];
                                if (!items[i]) items[i] = { title: row.title, value: "" };
                                items[i] = { ...items[i], value: v };
                                setContactEN({ ...contactEN, items });
                              }}
                            />
                          </div>
                          <DangerMini
                            onClick={() => {
                              setContact({
                                ...contact,
                                items: contact.items.filter((_, j) => j !== i),
                              });
                              setContactEN({
                                ...contactEN,
                                items: contactEN.items.filter((_, j) => j !== i),
                              });
                            }}
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() => {
                          const newItem = { title: "", value: "" };
                          setContact({ ...contact, items: [...contact.items, newItem] });
                          setContactEN({ ...contactEN, items: [...contactEN.items, newItem] });
                        }}
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
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            {t.siteContent.contact.fields.initials}
                          </label>
                          <input
                             className={scInput}
                             value={contact.agent.initials}
                             onChange={(e) => {
                               const v = e.target.value;
                               setContact({ ...contact, agent: { ...contact.agent, initials: v } });
                               setContactEN({ ...contactEN, agent: { ...contactEN.agent, initials: v } });
                             }}
                          />
                        </div>
                        <DualInput
                          label={t.siteContent.contact.fields.name}
                          mnValue={contact.agent.name}
                          enValue={contactEN.agent.name}
                          onChangeMN={(v) => setContact({ ...contact, agent: { ...contact.agent, name: v } })}
                          onChangeEN={(v) => setContactEN({ ...contactEN, agent: { ...contactEN.agent, name: v } })}
                        />
                      </div>
                      <DualInput
                         label={t.siteContent.contact.fields.role}
                         mnValue={contact.agent.role}
                         enValue={contactEN.agent.role}
                         onChangeMN={(v) => setContact({ ...contact, agent: { ...contact.agent, role: v } })}
                         onChangeEN={(v) => setContactEN({ ...contactEN, agent: { ...contactEN.agent, role: v } })}
                      />
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                         <div className="space-y-1.5">
                           <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                             {t.siteContent.contact.fields.telHref}
                           </label>
                           <input
                             className={scInput}
                             value={contact.agent.telHref}
                             onChange={(e) => {
                               const v = e.target.value;
                               setContact({ ...contact, agent: { ...contact.agent, telHref: v } });
                               setContactEN({ ...contactEN, agent: { ...contactEN.agent, telHref: v } });
                             }}
                           />
                         </div>
                         <DualInput
                           label={t.siteContent.contact.fields.telLabel}
                           mnValue={contact.agent.telLabel}
                           enValue={contactEN.agent.telLabel}
                           onChangeMN={(v) => setContact({ ...contact, agent: { ...contact.agent, telLabel: v } })}
                           onChangeEN={(v) => setContactEN({ ...contactEN, agent: { ...contactEN.agent, telLabel: v } })}
                         />
                      </div>
                    </div>
                  </EditorSection>
                    <DualInput
                      label={t.siteContent.contact.fields.formTitle}
                      mnValue={contact.formTitle}
                      enValue={contactEN.formTitle}
                      onChangeMN={(v) => setContact({ ...contact, formTitle: v })}
                      onChangeEN={(v) => setContactEN({ ...contactEN, formTitle: v })}
                    />
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
                    <div className="space-y-4">
                      <DualInput
                        label={t.siteContent.propertiesPage.fields.headerBadge}
                        mnValue={propertiesPage.header.badge}
                        enValue={propertiesPageEN.header.badge}
                        onChangeMN={(v) => setPropertiesPage({ ...propertiesPage, header: { ...propertiesPage.header, badge: v } })}
                        onChangeEN={(v) => setPropertiesPageEN({ ...propertiesPageEN, header: { ...propertiesPageEN.header, badge: v } })}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DualInput
                          label={t.siteContent.propertiesPage.fields.titleLine1}
                          mnValue={propertiesPage.header.titleLine1}
                          enValue={propertiesPageEN.header.titleLine1}
                          onChangeMN={(v) => setPropertiesPage({ ...propertiesPage, header: { ...propertiesPage.header, titleLine1: v } })}
                          onChangeEN={(v) => setPropertiesPageEN({ ...propertiesPageEN, header: { ...propertiesPageEN.header, titleLine1: v } })}
                        />
                        <DualInput
                          label={t.siteContent.propertiesPage.fields.titleAccent}
                          mnValue={propertiesPage.header.titleAccent}
                          enValue={propertiesPageEN.header.titleAccent}
                          onChangeMN={(v) => setPropertiesPage({ ...propertiesPage, header: { ...propertiesPage.header, titleAccent: v } })}
                          onChangeEN={(v) => setPropertiesPageEN({ ...propertiesPageEN, header: { ...propertiesPageEN.header, titleAccent: v } })}
                        />
                      </div>
                      <DualTextarea
                        label={t.siteContent.propertiesPage.fields.intro}
                        mnValue={propertiesPage.header.intro}
                        enValue={propertiesPageEN.header.intro}
                        onChangeMN={(v) => setPropertiesPage({ ...propertiesPage, header: { ...propertiesPage.header, intro: v } })}
                        onChangeEN={(v) => setPropertiesPageEN({ ...propertiesPageEN, header: { ...propertiesPageEN.header, intro: v } })}
                      />
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
                        <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3 dark:border-slate-800/40 dark:bg-slate-900/20">
                          <div className="flex-1">
                            <DualInput
                              label={t.siteContent.propertiesPage.fields.categoriesTitle}
                              mnValue={row}
                              enValue={propertiesPageEN.categories[i] ?? ""}
                              onChangeMN={(v) => {
                                const c = [...propertiesPage.categories];
                                c[i] = v;
                                setPropertiesPage({ ...propertiesPage, categories: c });
                              }}
                              onChangeEN={(v) => {
                                const c = [...propertiesPageEN.categories];
                                c[i] = v;
                                setPropertiesPageEN({ ...propertiesPageEN, categories: c });
                              }}
                            />
                          </div>
                          <DangerMini
                            onClick={() => {
                              setPropertiesPage({
                                ...propertiesPage,
                                categories: propertiesPage.categories.filter((_, j) => j !== i),
                              });
                              setPropertiesPageEN({
                                ...propertiesPageEN,
                                categories: propertiesPageEN.categories.filter((_, j) => j !== i),
                              });
                            }}
                          >
                            {t.siteContent.common.remove}
                          </DangerMini>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() => {
                          setPropertiesPage({ ...propertiesPage, categories: [...propertiesPage.categories, ""] });
                          setPropertiesPageEN({ ...propertiesPageEN, categories: [...propertiesPageEN.categories, ""] });
                        }}
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
                          <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                  {t.siteContent.propertiesPage.fields.id}
                                </label>
                                <input
                                  type="number"
                                  className={scInput}
                                  value={item.id}
                                  onChange={(e) => {
                                    const v = Number(e.target.value) || 0;
                                    const items = [...propertiesPage.items];
                                    items[i] = { ...items[i], id: v };
                                    setPropertiesPage({ ...propertiesPage, items });
                                    const itemsEN = [...propertiesPageEN.items];
                                    if (itemsEN[i]) {
                                      itemsEN[i] = { ...itemsEN[i], id: v };
                                      setPropertiesPageEN({ ...propertiesPageEN, items: itemsEN });
                                    }
                                  }}
                                />
                              </div>
                              <DualInput
                                label={t.siteContent.propertiesPage.fields.name}
                                mnValue={item.name}
                                enValue={propertiesPageEN.items[i]?.name ?? ""}
                                onChangeMN={(v) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = { ...items[i], name: v };
                                  setPropertiesPage({ ...propertiesPage, items });
                                }}
                                onChangeEN={(v) => {
                                  const items = [...propertiesPageEN.items];
                                  if (!items[i]) items[i] = { ...item, name: "" };
                                  items[i] = { ...items[i], name: v };
                                  setPropertiesPageEN({ ...propertiesPageEN, items });
                                }}
                              />
                              <DualInput
                                label={t.siteContent.propertiesPage.fields.category}
                                mnValue={item.category}
                                enValue={propertiesPageEN.items[i]?.category ?? ""}
                                onChangeMN={(v) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = { ...items[i], category: v };
                                  setPropertiesPage({ ...propertiesPage, items });
                                }}
                                onChangeEN={(v) => {
                                  const items = [...propertiesPageEN.items];
                                  if (!items[i]) items[i] = { ...item, category: "" };
                                  items[i] = { ...items[i], category: v };
                                  setPropertiesPageEN({ ...propertiesPageEN, items });
                                }}
                              />
                              <DualInput
                                label={t.siteContent.propertiesPage.fields.itemBadge}
                                mnValue={item.badge ?? ""}
                                enValue={propertiesPageEN.items[i]?.badge ?? ""}
                                onChangeMN={(v) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = { ...items[i], badge: v || null };
                                  setPropertiesPage({ ...propertiesPage, items });
                                }}
                                onChangeEN={(v) => {
                                  const items = [...propertiesPageEN.items];
                                  if (!items[i]) items[i] = { ...item, badge: null };
                                  items[i] = { ...items[i], badge: v || null };
                                  setPropertiesPageEN({ ...propertiesPageEN, items });
                                }}
                              />
                            </div>
                            <div className="space-y-4">
                              <ImageUploadField
                                previewFit="cover"
                                value={item.image}
                                onChange={(next) => {
                                  const items = [...propertiesPage.items];
                                  items[i] = { ...items[i], image: next };
                                  setPropertiesPage({ ...propertiesPage, items });
                                  const itemsEN = [...propertiesPageEN.items];
                                  if (itemsEN[i]) {
                                    itemsEN[i] = { ...itemsEN[i], image: next };
                                    setPropertiesPageEN({ ...propertiesPageEN, items: itemsEN });
                                  }
                                }}
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <DualInput
                                  label={t.siteContent.propertiesPage.fields.tag}
                                  mnValue={item.tag}
                                  enValue={propertiesPageEN.items[i]?.tag ?? ""}
                                  onChangeMN={(v) => {
                                    const items = [...propertiesPage.items];
                                    items[i] = { ...items[i], tag: v };
                                    setPropertiesPage({ ...propertiesPage, items });
                                  }}
                                  onChangeEN={(v) => {
                                    const items = [...propertiesPageEN.items];
                                    if (!items[i]) items[i] = { ...item, tag: "" };
                                    items[i] = { ...items[i], tag: v };
                                    setPropertiesPageEN({ ...propertiesPageEN, items });
                                  }}
                                />
                                <DualInput
                                  label={t.siteContent.propertiesPage.fields.size}
                                  mnValue={item.size}
                                  enValue={propertiesPageEN.items[i]?.size ?? ""}
                                  onChangeMN={(v) => {
                                    const items = [...propertiesPage.items];
                                    items[i] = { ...items[i], size: v };
                                    setPropertiesPage({ ...propertiesPage, items });
                                  }}
                                  onChangeEN={(v) => {
                                    const items = [...propertiesPageEN.items];
                                    if (!items[i]) items[i] = { ...item, size: "" };
                                    items[i] = { ...items[i], size: v };
                                    setPropertiesPageEN({ ...propertiesPageEN, items });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            <DualInput
                              label={t.siteContent.propertiesPage.fields.floor}
                              mnValue={item.floor}
                              enValue={propertiesPageEN.items[i]?.floor ?? ""}
                              onChangeMN={(v) => {
                                const items = [...propertiesPage.items];
                                items[i] = { ...items[i], floor: v };
                                setPropertiesPage({ ...propertiesPage, items });
                              }}
                              onChangeEN={(v) => {
                                const items = [...propertiesPageEN.items];
                                if (!items[i]) items[i] = { ...item, floor: "" };
                                items[i] = { ...items[i], floor: v };
                                setPropertiesPageEN({ ...propertiesPageEN, items });
                              }}
                            />
                            <DualInput
                              label={t.siteContent.propertiesPage.fields.parking}
                              mnValue={item.parking}
                              enValue={propertiesPageEN.items[i]?.parking ?? ""}
                              onChangeMN={(v) => {
                                const items = [...propertiesPage.items];
                                items[i] = { ...items[i], parking: v };
                                setPropertiesPage({ ...propertiesPage, items });
                              }}
                              onChangeEN={(v) => {
                                const items = [...propertiesPageEN.items];
                                if (!items[i]) items[i] = { ...item, parking: "" };
                                items[i] = { ...items[i], parking: v };
                                setPropertiesPageEN({ ...propertiesPageEN, items });
                              }}
                            />
                            <DualInput
                              label={t.siteContent.propertiesPage.fields.price}
                              mnValue={item.price}
                              enValue={propertiesPageEN.items[i]?.price ?? ""}
                              onChangeMN={(v) => {
                                const items = [...propertiesPage.items];
                                items[i] = { ...items[i], price: v };
                                setPropertiesPage({ ...propertiesPage, items });
                              }}
                              onChangeEN={(v) => {
                                const items = [...propertiesPageEN.items];
                                if (!items[i]) items[i] = { ...item, price: "" };
                                items[i] = { ...items[i], price: v };
                                setPropertiesPageEN({ ...propertiesPageEN, items });
                              }}
                            />
                          </div>
                          <div className="mt-4">
                            <DualTextarea
                              label={t.siteContent.propertiesPage.fields.description}
                              mnValue={item.description}
                              enValue={propertiesPageEN.items[i]?.description ?? ""}
                              onChangeMN={(v) => {
                                const items = [...propertiesPage.items];
                                items[i] = { ...items[i], description: v };
                                setPropertiesPage({ ...propertiesPage, items });
                              }}
                              onChangeEN={(v) => {
                                const items = [...propertiesPageEN.items];
                                if (!items[i]) items[i] = { ...item, description: "" };
                                items[i] = { ...items[i], description: v };
                                setPropertiesPageEN({ ...propertiesPageEN, items });
                              }}
                              rows={3}
                            />
                          </div>
                          <div className="mt-3 flex justify-end">
                            <DangerMini
                              onClick={() => {
                                setPropertiesPage({ ...propertiesPage, items: propertiesPage.items.filter((_, j) => j !== i) });
                                setPropertiesPageEN({ ...propertiesPageEN, items: propertiesPageEN.items.filter((_, j) => j !== i) });
                              }}
                            >
                              {t.siteContent.common.remove}
                            </DangerMini>
                          </div>
                        </div>
                      ))}
                      <GhostButton
                        onClick={() => {
                          const newItem = { id: Date.now(), name: "", image: "", category: "", badge: null, size: "", floor: "", parking: "", price: "", tag: "", description: "" };
                          setPropertiesPage({ ...propertiesPage, items: [...propertiesPage.items, newItem] });
                          setPropertiesPageEN({ ...propertiesPageEN, items: [...propertiesPageEN.items, newItem] });
                        }}
                      >
                        + {t.siteContent.common.add}
                      </GhostButton>
                    </div>
                  </EditorSection>
                  <EditorSection id="properties-cta" title={t.siteContent.propertiesPage.sections.cta}>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          {t.siteContent.propertiesPage.fields.href}
                        </label>
                        <input
                          className={scInput}
                          value={propertiesPage.cta.href}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPropertiesPage({ ...propertiesPage, cta: { ...propertiesPage.cta, href: v } });
                            setPropertiesPageEN({ ...propertiesPageEN, cta: { ...propertiesPageEN.cta, href: v } });
                          }}
                        />
                      </div>
                      <DualInput
                        label={t.siteContent.propertiesPage.fields.label}
                        mnValue={propertiesPage.cta.label}
                        enValue={propertiesPageEN.cta.label}
                        onChangeMN={(v) => setPropertiesPage({ ...propertiesPage, cta: { ...propertiesPage.cta, label: v } })}
                        onChangeEN={(v) => setPropertiesPageEN({ ...propertiesPageEN, cta: { ...propertiesPageEN.cta, label: v } })}
                      />
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
                    <div className="space-y-4">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <DualInput
                          label={t.siteContent.salesPage.fields.eyebrow}
                          mnValue={salesPage.header.eyebrow}
                          enValue={salesPageEN.header.eyebrow}
                          onChangeMN={(v) => setSalesPage({ ...salesPage, header: { ...salesPage.header, eyebrow: v } })}
                          onChangeEN={(v) => setSalesPageEN({ ...salesPageEN, header: { ...salesPageEN.header, eyebrow: v } })}
                        />
                        <DualInput
                          label={t.siteContent.salesPage.fields.title}
                          mnValue={salesPage.header.title}
                          enValue={salesPageEN.header.title}
                          onChangeMN={(v) => setSalesPage({ ...salesPage, header: { ...salesPage.header, title: v } })}
                          onChangeEN={(v) => setSalesPageEN({ ...salesPageEN, header: { ...salesPageEN.header, title: v } })}
                        />
                      </div>
                    </div>
                  </EditorSection>
                  <EditorSection id="sales-intro" title={t.siteContent.salesPage.fields.intro}>
                    <DualTextarea
                      label={t.siteContent.salesPage.fields.intro}
                      mnValue={salesPage.header.intro}
                      enValue={salesPageEN.header.intro}
                      onChangeMN={(v) => setSalesPage({ ...salesPage, header: { ...salesPage.header, intro: v } })}
                      onChangeEN={(v) => setSalesPageEN({ ...salesPageEN, header: { ...salesPageEN.header, intro: v } })}
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
                    <DualInput
                      label={t.siteContent.jobsPage.fields.title}
                      mnValue={jobsPage.header.title}
                      enValue={jobsPageEN.header.title}
                      onChangeMN={(v) => setJobsPage({ ...jobsPage, header: { ...jobsPage.header, title: v } })}
                      onChangeEN={(v) => setJobsPageEN({ ...jobsPageEN, header: { ...jobsPageEN.header, title: v } })}
                    />
                  </EditorSection>
                  <EditorSection id="jobs-header-intro" title={lang === "mn" ? "Дэд тайлбар" : "Intro"}>
                    <DualTextarea
                      label={t.siteContent.jobsPage.fields.intro}
                      mnValue={jobsPage.header.intro}
                      enValue={jobsPageEN.header.intro}
                      onChangeMN={(v) => setJobsPage({ ...jobsPage, header: { ...jobsPage.header, intro: v } })}
                      onChangeEN={(v) => setJobsPageEN({ ...jobsPageEN, header: { ...jobsPageEN.header, intro: v } })}
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
                    <div className="space-y-4">
                      <DualInput
                         label={lang === "mn" ? "Дээд шошго" : "Eyebrow"}
                         mnValue={teamPage.header.eyebrow}
                         enValue={teamPageEN.header.eyebrow}
                         onChangeMN={(v) => setTeamPage({ ...teamPage, header: { ...teamPage.header, eyebrow: v } })}
                         onChangeEN={(v) => setTeamPageEN({ ...teamPageEN, header: { ...teamPageEN.header, eyebrow: v } })}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DualInput
                          label={lang === "mn" ? "Гарчиг (эхний хэсэг)" : "Title (First Part)"}
                          mnValue={teamPage.header.h2Line1}
                          enValue={teamPageEN.header.h2Line1}
                          onChangeMN={(v) => setTeamPage({ ...teamPage, header: { ...teamPage.header, h2Line1: v } })}
                          onChangeEN={(v) => setTeamPageEN({ ...teamPageEN, header: { ...teamPageEN.header, h2Line1: v } })}
                        />
                        <DualInput
                          label={lang === "mn" ? "Гарчиг (онцлох өнгө)" : "Title (Accent Color)"}
                          mnValue={teamPage.header.h2Accent}
                          enValue={teamPageEN.header.h2Accent}
                          onChangeMN={(v) => setTeamPage({ ...teamPage, header: { ...teamPage.header, h2Accent: v } })}
                          onChangeEN={(v) => setTeamPageEN({ ...teamPageEN, header: { ...teamPageEN.header, h2Accent: v } })}
                        />
                      </div>
                      <DualTextarea
                         label={lang === "mn" ? "Танилцуулга" : "Intro"}
                         mnValue={teamPage.header.intro}
                         enValue={teamPageEN.header.intro}
                         onChangeMN={(v) => setTeamPage({ ...teamPage, header: { ...teamPage.header, intro: v } })}
                         onChangeEN={(v) => setTeamPageEN({ ...teamPageEN, header: { ...teamPageEN.header, intro: v } })}
                      />
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
                    <div className="space-y-4">
                      <DualInput
                        label={lang === "mn" ? "Гарчиг" : "Title"}
                        mnValue={teamPage.cta.title}
                        enValue={teamPageEN.cta.title}
                        onChangeMN={(v) => setTeamPage({ ...teamPage, cta: { ...teamPage.cta, title: v } })}
                        onChangeEN={(v) => setTeamPageEN({ ...teamPageEN, cta: { ...teamPageEN.cta, title: v } })}
                      />
                      <DualTextarea
                        label={lang === "mn" ? "Дэд текст" : "Subtitle"}
                        mnValue={teamPage.cta.subtitle}
                        enValue={teamPageEN.cta.subtitle}
                        onChangeMN={(v) => setTeamPage({ ...teamPage, cta: { ...teamPage.cta, subtitle: v } })}
                        onChangeEN={(v) => setTeamPageEN({ ...teamPageEN, cta: { ...teamPageEN.cta, subtitle: v } })}
                        rows={2}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DualInput
                          label={lang === "mn" ? "Товчны текст" : "Button Label"}
                          mnValue={teamPage.cta.buttonLabel}
                          enValue={teamPageEN.cta.buttonLabel}
                          onChangeMN={(v) => setTeamPage({ ...teamPage, cta: { ...teamPage.cta, buttonLabel: v } })}
                          onChangeEN={(v) => setTeamPageEN({ ...teamPageEN, cta: { ...teamPageEN.cta, buttonLabel: v } })}
                        />
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                             {lang === "mn" ? "Холбоос (ж: /contact)" : "Href (e.g., /contact)"}
                          </label>
                          <input
                            className={scInput}
                            value={teamPage.cta.buttonHref}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTeamPage({ ...teamPage, cta: { ...teamPage.cta, buttonHref: v } });
                              setTeamPageEN({ ...teamPageEN, cta: { ...teamPageEN.cta, buttonHref: v } });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </EditorSection>
                  <PrimarySave
                    disabled={saving}
                    onClick={() => void save("team")}
                  >
                    {saving ? t.common.saving : t.siteContent.common.saveTab(t.siteContent.tabs.team.label)}
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
                    <div className="space-y-4">
                      <DualInput
                        label={lang === "mn" ? "Лого хэсгийн гарчиг" : "Logo Section Title"}
                        mnValue={footer.partners.partnersLabel}
                        enValue={footerEN.partners.partnersLabel}
                        onChangeMN={(v) => setFooter({ ...footer, partners: { ...footer.partners, partnersLabel: v } })}
                        onChangeEN={(v) => setFooterEN({ ...footerEN, partners: { ...footerEN.partners, partnersLabel: v } })}
                      />
                      <DualTextarea
                         label={lang === "mn" ? "Танилцуулга (брэндийн текст)" : "Brand Intro Text"}
                         mnValue={footer.brand.desc}
                         enValue={footerEN.brand.desc}
                         onChangeMN={(v) => setFooter({ ...footer, brand: { desc: v } })}
                         onChangeEN={(v) => setFooterEN({ ...footerEN, brand: { desc: v } })}
                         rows={3}
                      />
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
                            <div className="flex-1">
                              <DualInput
                                label={lang === "mn" ? "Нэр" : "Name"}
                                mnValue={row.name}
                                enValue={footerEN.partners.items[i]?.name ?? ""}
                                onChangeMN={(v) => {
                                  const items = [...footer.partners.items];
                                  items[i] = { ...items[i], name: v };
                                  setFooter({ ...footer, partners: { ...footer.partners, items } });
                                }}
                                onChangeEN={(v) => {
                                  const items = [...footerEN.partners.items];
                                  if (!items[i]) items[i] = { ...row, name: "" };
                                  items[i] = { ...items[i], name: v };
                                  setFooterEN({ ...footerEN, partners: { ...footerEN.partners, items } });
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
                                  setFooter({ ...footer, partners: { ...footer.partners, items } });
                                  const itemsEN = [...footerEN.partners.items];
                                  if (itemsEN[i]) {
                                    itemsEN[i] = { ...itemsEN[i], src: next };
                                    setFooterEN({ ...footerEN, partners: { ...footerEN.partners, items: itemsEN } });
                                  }
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Width</label>
                                <input
                                  type="number"
                                  className={scInput}
                                  value={row.width}
                                  onChange={(next) => {
                                    const v = Number(next.target.value) || 0;
                                    const items = [...footer.partners.items];
                                    items[i] = { ...items[i], width: v };
                                    setFooter({ ...footer, partners: { ...footer.partners, items } });
                                    const itemsEN = [...footerEN.partners.items];
                                    if (itemsEN[i]) {
                                      itemsEN[i] = { ...itemsEN[i], width: v };
                                      setFooterEN({ ...footerEN, partners: { ...footerEN.partners, items: itemsEN } });
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Height</label>
                                <input
                                  type="number"
                                  className={scInput}
                                  value={row.height}
                                  onChange={(next) => {
                                    const v = Number(next.target.value) || 0;
                                    const items = [...footer.partners.items];
                                    items[i] = { ...items[i], height: v };
                                    setFooter({ ...footer, partners: { ...footer.partners, items } });
                                    const itemsEN = [...footerEN.partners.items];
                                    if (itemsEN[i]) {
                                      itemsEN[i] = { ...itemsEN[i], height: v };
                                      setFooterEN({ ...footerEN, partners: { ...footerEN.partners, items: itemsEN } });
                                    }
                                  }}
                                />
                              </div>
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
                        onClick={() => {
                          const newItem = { name: "", src: "", width: 100, height: 36 };
                          setFooter({ ...footer, partners: { ...footer.partners, items: [...footer.partners.items, newItem] } });
                          setFooterEN({ ...footerEN, partners: { ...footerEN.partners, items: [...footerEN.partners.items, newItem] } });
                        }}
                      >
                        + {lang === "mn" ? "Түнш нэмэх" : "Add Partner"}
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
