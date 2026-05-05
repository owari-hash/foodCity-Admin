"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureClientAuthorized,
  readClientAdminProfile,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { 
  Phone, Trash2, Plus, CheckCircle2, AlertCircle, Save, 
  User, Mail, Clock, Inbox, ChevronRight, Search, Filter 
} from "lucide-react";

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "read" | "responded";
  createdAt: string;
  updatedAt: string;
}

interface SMSConfig {
  _id?: string;
  adminPhoneNumbers: string[];
  notificationSettings: {
    sendOnContactSubmission: boolean;
  };
  templates: {
    contactSubmission: string;
  };
  updatedBy?: string;
}

const translations = {
  mn: {
    title: "Мессеж болон санал",
    description: "Хэрэглэгчийн санал хүсэлтийн удирдлага",
    adminPhones: "Мэдэгдэл хүлээн авах",
    template: "SMS загвар",
    templateDesc: "{name}, {phone}, {email}, {subject} ашиглана уу",
    noSubmissions: "Одоогоор санал хүсэлт ирээгүй байна",
    details: "Дэлгэрэнгүй мэдээлэл",
    save: "Тохиргоо хадгалах",
    loading: "Уншиж байна...",
    saved: "Амжилттай хадгалагдлаа",
    placeholderPhone: "+976...",
    all: "Бүх санал",
    new: "Шинэ",
    read: "Уншсан",
    responded: "Хариулсан",
    searchPlaceholder: "Хайх...",
  },
  en: {
    title: "Messages & Feedback",
    description: "Manage customer feedback & SMS alerts",
    adminPhones: "Alert Recipients",
    template: "SMS Template",
    templateDesc: "Use {name}, {phone}, {email}, {subject}",
    noSubmissions: "No submissions found",
    details: "Submission Details",
    save: "Save Configuration",
    loading: "Loading content...",
    saved: "Successfully updated",
    placeholderPhone: "+976...",
    all: "All Messages",
    new: "New",
    read: "Read",
    responded: "Responded",
    searchPlaceholder: "Search submissions...",
  },
};

export default function SMSConfigPage() {
  const { lang } = useAdminLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "new" | "read" | "responded">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, subRes] = await Promise.all([
        fetch(joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config"), withClientAdminAuth()),
        fetch(joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/contact/submissions"), withClientAdminAuth()),
      ]);
      await ensureClientAuthorized(configRes);
      await ensureClientAuthorized(subRes);
      if (!configRes.ok || !subRes.ok) throw new Error("Data sync failed");
      const configJson = await configRes.json();
      const subJson = await subRes.json();
      setConfig(configJson.config);
      setSubmissions(subJson.submissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const profile = readClientAdminProfile();
    try {
      const res = await fetch(joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...withClientAdminAuth().headers },
        body: JSON.stringify({ ...config, updatedBy: profile?.displayName || "admin" }),
      });
      if (!res.ok) throw new Error("Update failed");
      setSuccess(t.saved);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError("Failed to sync configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhone = () => {
    if (!newPhone.trim() || !config) return;
    if (config.adminPhoneNumbers.includes(newPhone.trim())) return;
    setConfig({ ...config, adminPhoneNumbers: [...config.adminPhoneNumbers, newPhone.trim()] });
    setNewPhone("");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/contact/submissions/${id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...withClientAdminAuth().headers },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setSubmissions(submissions.map(s => s._id === id ? { ...s, status: newStatus as any } : s));
      if (selectedSubmission?._id === id) setSelectedSubmission({ ...selectedSubmission, status: newStatus as any });
    } catch (e) {
      setError("Status update failed");
    }
  };

  const filtered = submissions
    .filter(s => filterStatus === "all" || s.status === filterStatus)
    .filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.phone.includes(searchQuery) || 
      s.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-600"></div>
        <p className="text-sm text-zinc-400 font-medium">{t.loading}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex flex-col gap-6 p-4 md:p-8 lg:p-0 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{t.title}</h1>
          <p className="mt-1 text-zinc-500">{t.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700 animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-95 disabled:opacity-50"
          >
            <Save className={`h-4 w-4 transition-transform ${saving ? "animate-spin" : "group-hover:scale-110"}`} />
            <span>{saving ? "..." : t.save}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Sidebar: Configuration */}
        <aside className="space-y-8 lg:col-span-4">
          <div className="group rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">{t.adminPhones}</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              {config?.adminPhoneNumbers.map((phone, idx) => (
                <div key={idx} className="group/item flex items-center justify-between rounded-2xl border border-zinc-50 bg-zinc-50/50 p-4 transition-all hover:border-emerald-100 hover:bg-white">
                  <span className="font-mono text-sm font-medium text-zinc-600">{phone}</span>
                  <button 
                    onClick={() => setConfig({...config!, adminPhoneNumbers: config!.adminPhoneNumbers.filter((_, i) => i !== idx)})} 
                    className="rounded-xl p-2 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover/item:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <div className="mt-4 flex gap-2">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddPhone()}
                  placeholder={t.placeholderPhone}
                  className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-5 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
                />
                <button 
                  onClick={handleAddPhone} 
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white transition-transform active:scale-90"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="group rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">{t.template}</h3>
            </div>
            <textarea
              value={config?.templates.contactSubmission}
              onChange={e => setConfig({...config!, templates: { contactSubmission: e.target.value }})}
              rows={6}
              placeholder="SMS Template..."
              className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-sm leading-relaxed outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
        </aside>

        {/* Main Content: Submissions CRM */}
        <main className="space-y-6 lg:col-span-8">
          {/* Submissions List Header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {(["all", "new", "read", "responded"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                    filterStatus === s 
                      ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {t[s as keyof typeof t]}
                  <span className={`ml-2 text-xs opacity-60`}>
                    {s === "all" ? submissions.length : submissions.filter(x => x.status === s).length}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-zinc-100 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 overflow-hidden rounded-[32px] border border-zinc-100 bg-white shadow-xl lg:grid-cols-2 lg:h-[700px]">
            {/* List Pane */}
            <div className="border-r border-zinc-50 flex flex-col">
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {filtered.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                      <Inbox className="h-8 w-8 text-zinc-200" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">{t.noSubmissions}</p>
                  </div>
                ) : (
                  filtered.map(s => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedSubmission(s)}
                      className={`group flex w-full flex-col border-b border-zinc-50 p-6 text-left transition-all hover:bg-zinc-50/50 ${
                        selectedSubmission?._id === s._id ? "bg-emerald-50/30 border-r-4 border-r-emerald-500" : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          s.status === "new" ? "bg-blue-500 shadow-lg shadow-blue-200" : 
                          s.status === "read" ? "bg-amber-400" : "bg-emerald-500"
                        }`} />
                        <span className="text-[10px] font-bold text-zinc-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex-1 truncate text-base font-semibold text-zinc-900">{s.name || s.phone}</span>
                        <ChevronRight className={`h-4 w-4 text-zinc-300 transition-transform ${selectedSubmission?._id === s._id ? "translate-x-1 text-emerald-500" : "group-hover:translate-x-1"}`} />
                      </div>
                      <span className="mt-1 truncate text-sm text-zinc-500 font-medium">{s.message.substring(0, 80)}...</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Details Pane */}
            <div className="hidden flex-col bg-zinc-50/30 lg:flex">
              {selectedSubmission ? (
                <div className="flex flex-col h-full p-10">
                  <div className="mb-10 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <User className="h-6 w-6 text-zinc-400" />
                    </div>
                    <select
                      value={selectedSubmission.status}
                      onChange={e => handleStatusChange(selectedSubmission._id, e.target.value)}
                      className="rounded-full border border-zinc-200 bg-white px-6 py-2 text-xs font-bold shadow-sm outline-none transition-all hover:border-zinc-300"
                    >
                      <option value="new">{t.new}</option>
                      <option value="read">{t.read}</option>
                      <option value="responded">{t.responded}</option>
                    </select>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-900">{selectedSubmission.name || "Anonymous User"}</h2>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm">
                          <Phone className="h-4 w-4 text-emerald-500" />
                          {selectedSubmission.phone}
                        </div>
                        {selectedSubmission.email && (
                          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm">
                            <Mail className="h-4 w-4 text-blue-500" />
                            {selectedSubmission.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm">
                      <div className="mb-6 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Message</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(selectedSubmission.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-lg leading-relaxed text-zinc-700 font-medium">
                        {selectedSubmission.message}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-20 text-center opacity-30">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-white shadow-xl">
                    <Filter className="h-10 w-10 text-zinc-300" />
                  </div>
                  <p className="text-lg font-semibold text-zinc-400">Select a submission to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
