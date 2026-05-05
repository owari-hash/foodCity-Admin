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
  Phone, Trash2, Plus, Inbox, ChevronRight, Search, Filter, User, Mail, Clock 
} from "lucide-react";
import { 
  EditorSurface, 
  Panel, 
  EditorAlerts,
  ListRow
} from "../site-content/editorUi";

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
}

const translations = {
  mn: {
    title: "Мессеж болон санал",
    description: "Хэрэглэгчийн санал хүсэлтийн удирдлага",
    adminPhones: "Мэдэгдэл хүлээн авах дугаарууд",
    noSubmissions: "Одоогоор санал хүсэлт ирээгүй байна",
    details: "Дэлгэрэнгүй мэдээлэл",
    save: "Хадгалах",
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
    noSubmissions: "No submissions found",
    details: "Submission Details",
    save: "Save Config",
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
  
  const [config, setConfig] = useState<SMSConfig>({
    adminPhoneNumbers: []
  });
  const [newPhone, setNewPhone] = useState("");
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
      const configUrl = joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config");
      const subUrl = joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/contact/submissions");
      
      // Config is now OPEN (no auth headers)
      const configRes = await fetch(configUrl);
      // Submissions still need auth
      const subRes = await fetch(subUrl, withClientAdminAuth());
      
      await ensureClientAuthorized(subRes);
      
      if (!configRes.ok || !subRes.ok) throw new Error("Data sync failed");
      
      const configJson = await configRes.json();
      const subJson = await subRes.json();
      
      if (configJson.config) setConfig(configJson.config);
      setSubmissions(subJson.submissions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const apiPutConfig = async (newConfig: SMSConfig) => {
    const profile = readClientAdminProfile();
    const url = joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config");
    
    // Config PUT is now OPEN (no auth headers)
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newConfig, updatedBy: profile?.displayName || "admin" }),
    });
    
    if (!res.ok) throw new Error("Update failed");
    return res;
  };

  const handleAddPhone = async () => {
    const phone = newPhone.trim();
    if (!phone) return;
    if (config.adminPhoneNumbers.includes(phone)) return;
    
    const updated = { ...config, adminPhoneNumbers: [...config.adminPhoneNumbers, phone] };
    setConfig(updated);
    setNewPhone("");
    
    try {
      await apiPutConfig(updated);
      setSuccess(t.saved);
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError("Failed to add phone number.");
    }
  };

  const handleDeletePhone = async (idx: number) => {
    const updated = { ...config, adminPhoneNumbers: config.adminPhoneNumbers.filter((_, i) => i !== idx) };
    setConfig(updated);
    try {
      await apiPutConfig(updated);
      setSuccess(t.saved);
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError("Failed to remove phone number.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(joinBackendRequestUrl(getApiBaseUrl(), `/api/v1/contact/submissions/${id}/status`), withClientAdminAuth({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }));
      await ensureClientAuthorized(res);
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
    <div className="flex h-[80vh] items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-100 border-t-slate-800"></div>
        <p className="text-sm">{t.loading}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 bg-white min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.description}</p>
      </header>

      <EditorAlerts error={error} saved={success} />

      <EditorSurface>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Settings Section */}
          <div className="space-y-8 lg:col-span-4">
            <Panel title={t.adminPhones}>
              <div className="space-y-3">
                {config.adminPhoneNumbers.map((phone, idx) => (
                  <ListRow key={idx}>
                    <div className="flex flex-1 items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-800">{phone}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDeletePhone(idx)} 
                      className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </ListRow>
                ))}
                
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddPhone()}
                    placeholder={t.placeholderPhone}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-500/5"
                  />
                  <button 
                    type="button"
                    onClick={handleAddPhone} 
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md active:scale-95 transition-transform"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Panel>
          </div>

          {/* Submissions Section */}
          <div className="lg:col-span-8">
            <Panel title={t.all}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {(["all", "new", "read", "responded"] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterStatus(s)}
                      className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all ${
                        filterStatus === s 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {t[s as keyof typeof t]}
                    </button>
                  ))}
                </div>
                
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none transition-all focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-2 lg:h-[600px] bg-white">
                {/* List */}
                <div className="border-r border-slate-100 flex flex-col">
                  <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
                    {filtered.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center p-12 text-center text-slate-400">
                        <Inbox className="h-8 w-8 mb-4 opacity-10" />
                        <p className="text-xs font-medium">{t.noSubmissions}</p>
                      </div>
                    ) : (
                      filtered.map(s => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => setSelectedSubmission(s)}
                          className={`group flex w-full flex-col p-5 text-left transition-all ${
                            selectedSubmission?._id === s._id ? "bg-slate-50 shadow-[inset_4px_0_0_#0f172a]" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className={`h-2 w-2 rounded-full ${
                              s.status === "new" ? "bg-blue-500" : 
                              s.status === "read" ? "bg-amber-400" : "bg-emerald-500"
                            }`} />
                            <span className="text-[10px] font-bold text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex-1 truncate text-sm font-bold text-slate-900">{s.name || s.phone}</span>
                            <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform ${selectedSubmission?._id === s._id ? "translate-x-1 text-slate-900" : "group-hover:translate-x-1"}`} />
                          </div>
                          <span className="mt-1 truncate text-xs text-slate-500">{s.message.substring(0, 80)}...</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="hidden flex-col bg-slate-50/20 lg:flex">
                  {selectedSubmission ? (
                    <div className="flex flex-col h-full p-8 overflow-y-auto">
                      <div className="mb-8 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <select
                          value={selectedSubmission.status}
                          onChange={e => handleStatusChange(selectedSubmission._id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm outline-none transition-all hover:border-slate-400"
                        >
                          <option value="new">{t.new}</option>
                          <option value="read">{t.read}</option>
                          <option value="responded">{t.responded}</option>
                        </select>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-extrabold text-slate-900">{selectedSubmission.name || "Anonymous"}</h2>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-100 shadow-sm">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {selectedSubmission.phone}
                            </div>
                            {selectedSubmission.email && (
                              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-100 shadow-sm">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                {selectedSubmission.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                          <div className="mb-6 flex items-center justify-between border-b border-slate-50 pb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submission</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(selectedSubmission.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
                            {selectedSubmission.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-12 text-center opacity-20">
                      <Filter className="h-8 w-8 text-slate-900 mb-4" />
                      <p className="text-sm font-bold text-slate-900">Select to view</p>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </EditorSurface>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
