"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trash2,
  Plus,
  Briefcase,
  MapPin,
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit,
  Clock,
  User,
} from "lucide-react";
import {
  withClientAdminAuth,
  ensureClientAuthorized,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import ImageUploadField from "@/components/ImageUploadField";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { DualInput, DualTextarea } from "../site-content/editorUi";

type LangContent = {
  title: string;
  location: string;
  description: string;
  salary: string;
};

type Job = {
  id: string;
  mn: LangContent;
  en: LangContent;
  company: string;
  contactEmail?: string;
  imageUrl?: string;
  active: boolean;
  postedByDisplayName?: string;
  postedByUsername?: string;
  lastEditedByDisplayName?: string;
  lastEditedByUsername?: string;
};

export default function JobsPage() {
  const { t, lang } = useAdminLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formJob, setFormJob] = useState<Partial<Job>>({
    mn: { title: "", location: "", description: "", salary: "" },
    en: { title: "", location: "", description: "", salary: "" },
    company: "FoodCity ХХК",
    active: true,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/jobs"),
        withClientAdminAuth(),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      const json = (await res.json()) as { data: Job[] };
      setJobs(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(
      (j) =>
        j.mn.title.toLowerCase().includes(q) ||
        j.en.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q),
    );
  }, [jobs, searchQuery]);

  function openAdd() {
    setEditingJob(null);
    setFormJob({
      mn: { title: "", location: "", description: "", salary: "" },
      en: { title: "", location: "", description: "", salary: "" },
      company: "FoodCity ХХК",
      active: true,
    });
    setIsDialogOpen(true);
  }

  function openEdit(job: Job) {
    setEditingJob(job);
    setFormJob({ ...job });
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditingJob(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingJob
        ? joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs/${editingJob.id}`)
        : joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/jobs");

      const res = await fetch(
        url,
        withClientAdminAuth({
          method: editingJob ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formJob),
        }),
      );
      if (!res.ok) throw new Error(await res.text());

      closeDialog();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(job: Job) {
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs/${job.id}`),
        withClientAdminAuth({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !job.active }),
        }),
      );
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  async function deleteJob(id: string) {
    if (!confirm(lang === "mn" ? "Устгахдаа итгэлтэй байна уу?" : "Are you sure?"))
      return;
    try {
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/admin/jobs/${id}`),
        withClientAdminAuth({ method: "DELETE" }),
      );
      if (!res.ok) throw new Error(await res.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  const dialogModal = isDialogOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {editingJob ? t.jobs.editJob : t.jobs.addJob}
          </h2>
          <button
            onClick={closeDialog}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <DualInput
              label={t.jobs.fields.title}
              mnValue={formJob.mn?.title || ""}
              enValue={formJob.en?.title || ""}
              onChangeMN={(v) =>
                setFormJob({ ...formJob, mn: { ...formJob.mn!, title: v } })
              }
              onChangeEN={(v) =>
                setFormJob({ ...formJob, en: { ...formJob.en!, title: v } })
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <DualInput
                label={t.jobs.fields.location}
                mnValue={formJob.mn?.location || ""}
                enValue={formJob.en?.location || ""}
                onChangeMN={(v) =>
                  setFormJob({ ...formJob, mn: { ...formJob.mn!, location: v } })
                }
                onChangeEN={(v) =>
                  setFormJob({ ...formJob, en: { ...formJob.en!, location: v } })
                }
              />
              <DualInput
                label={t.jobs.fields.salary}
                mnValue={formJob.mn?.salary || ""}
                enValue={formJob.en?.salary || ""}
                onChangeMN={(v) =>
                  setFormJob({ ...formJob, mn: { ...formJob.mn!, salary: v } })
                }
                onChangeEN={(v) =>
                  setFormJob({ ...formJob, en: { ...formJob.en!, salary: v } })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {t.jobs.fields.company}
                </label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-hidden transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950"
                  value={formJob.company || ""}
                  onChange={(e) =>
                    setFormJob({ ...formJob, company: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {t.jobs.fields.contactEmail}
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-hidden transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950"
                  value={formJob.contactEmail || ""}
                  onChange={(e) =>
                    setFormJob({ ...formJob, contactEmail: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                {t.jobs.fields.imageUrl}
              </label>
              <ImageUploadField
                value={formJob.imageUrl || ""}
                onChange={(v) => setFormJob({ ...formJob, imageUrl: v })}
              />
            </div>

            <DualTextarea
              label={t.jobs.fields.description}
              mnValue={formJob.mn?.description || ""}
              enValue={formJob.en?.description || ""}
              onChangeMN={(v) =>
                setFormJob({ ...formJob, mn: { ...formJob.mn!, description: v } })
              }
              onChangeEN={(v) =>
                setFormJob({ ...formJob, en: { ...formJob.en!, description: v } })
              }
              rows={6}
            />

            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setFormJob({ ...formJob, active: !formJob.active })}
                className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-hidden ${formJob.active ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${formJob.active ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {formJob.active ? t.jobs.status.active : t.jobs.status.inactive}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? t.common.saving : editingJob ? t.common.update : t.common.add}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.jobs.title}</p>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          {t.jobs.addJob}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder={t.jobs.searchPlaceholder}
          className="w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 py-3 text-sm outline-hidden transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {dialogModal}

      <ul className="space-y-3">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                      {lang === "mn" ? job.mn.title : job.en.title}
                    </h3>
                    {!job.active && (
                      <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:bg-zinc-800">
                        {t.jobs.status.inactive}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{job.company}</p>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {lang === "mn" ? job.mn.location : job.en.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <DollarSign className="h-3.5 w-3.5" />
                    {lang === "mn" ? job.mn.salary : job.en.salary}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(
                      (job as any).createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <User className="h-3.5 w-3.5" />
                    {job.postedByDisplayName || job.postedByUsername || "System"}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => toggleActive(job)}
                  title={job.active ? "Deactivate" : "Activate"}
                  className={`rounded-lg p-2 transition-colors ${job.active ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"}`}
                >
                  {job.active ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(job)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-rose-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}

        {!loading && filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
            <Briefcase className="mb-4 h-12 w-12 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              {searchQuery ? t.jobs.noResults : t.jobs.empty}
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}
      </ul>
    </div>
  );
}
