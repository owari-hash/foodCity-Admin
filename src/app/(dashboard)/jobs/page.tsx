"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trash2,
  Briefcase,
  Search,
  ExternalLink,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  withClientAdminAuth,
  ensureClientAuthorized,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";

type JobApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  fullName: string;
  phone: string;
  email?: string;
  cvUrl: string;
  message?: string;
  status: "new" | "reviewed" | "rejected";
  createdAt: string;
};

export default function JobsPage() {
  const { t, lang } = useAdminLanguage();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/job-applications"),
        withClientAdminAuth(),
      );
      const gate = await ensureClientAuthorized(res);
      if (gate !== "ok") return;
      if (!res.ok) throw new Error(await res.text());

      const json = (await res.json()) as { data: JobApplication[] };
      setApps(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredApps = useMemo(() => {
    if (!searchQuery) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        (a.email && a.email.toLowerCase().includes(q)),
    );
  }, [apps, searchQuery]);

  async function deleteApp(id: string) {
    if (!confirm(lang === "mn" ? "Устгахдаа итгэлтэй байна уу?" : "Are you sure?"))
      return;
    try {
      // Note: We'll need to add a delete endpoint for applications too if we want this button to work
      // For now, I'll just keep it as a UI placeholder or I'll add the endpoint later.
      // Actually, I'll just implement the view first.
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {lang === "mn" ? "Ирсэн CV-нүүд" : "Job Applications"}
          </h1>
          <p className="text-sm text-zinc-500">
            {lang === "mn" ? "Нийт ирсэн анкетуудын жагсаалт" : "List of all received job applications"}
          </p>
        </div>
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
          placeholder={lang === "mn" ? "Нэр, утас, ажлын нэрээр хайх..." : "Search by name, phone, or job title..."}
          className="w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 py-3 text-sm outline-hidden transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <User className="h-6 w-6" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {app.fullName}
                    </h3>
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:bg-zinc-800">
                      {app.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      {app.jobTitle}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Утас</p>
                    <a href={`tel:${app.phone}`} className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-indigo-600 dark:text-zinc-300">
                      <Phone className="h-3.5 w-3.5" />
                      {app.phone}
                    </a>
                  </div>
                  {app.email && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Имэйл</p>
                      <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-indigo-600 dark:text-zinc-300">
                        <Mail className="h-3.5 w-3.5" />
                        {app.email}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-zinc-100 pt-4 sm:border-0 sm:pt-0">
                  <a
                    href={joinBackendRequestUrl(getApiBaseUrl(), app.cvUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 sm:flex-none"
                  >
                    <FileText className="h-4 w-4" />
                    CV Үзэх
                  </a>
                </div>
              </div>
            </div>
            {app.message && (
              <div className="border-t border-zinc-50 bg-zinc-50/50 p-4 text-xs text-zinc-600 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-400">
                <p className="font-bold uppercase tracking-wider text-zinc-400 mb-1">Зурвас:</p>
                {app.message}
              </div>
            )}
          </div>
        ))}

        {!loading && filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 py-20 dark:border-zinc-800">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-300 dark:bg-zinc-900">
              <FileText className="h-8 w-8" />
            </div>
            <p className="text-zinc-500">
              {searchQuery ? "Хайлтад тохирох анкет олдсонгүй" : "Одоогоор анкет ирээгүй байна"}
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
