"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readClientAdminProfile,
  withClientAdminAuth,
} from "@/lib/adminClientAuth";
import { getApiBaseUrl, joinBackendRequestUrl } from "@/lib/api";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { 
  Phone, Trash2, Plus, Inbox, Search, Mail, Clock 
} from "lucide-react";
import { 
  EditorSurface, 
  Panel, 
  EditorAlerts,
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
    all: "Бүх санал",
    saved: "Амжилттай хадгалагдлаа",
    placeholderPhone: "+976...",
    searchPlaceholder: "Хайх...",
  },
  en: {
    title: "Messages & Feedback",
    description: "Manage customer feedback & SMS alerts",
    adminPhones: "Alert Recipients",
    noSubmissions: "No submissions found",
    all: "All Messages",
    saved: "Successfully updated",
    placeholderPhone: "+976...",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const configUrl = joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/admin/sms-config");
      const subUrl = joinBackendRequestUrl(getApiBaseUrl(), "/api/v1/contact/submissions");
      
      const [configRes, subRes] = await Promise.all([
        fetch(configUrl),
        fetch(subUrl, withClientAdminAuth()),
      ]);
      
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

  const filtered = submissions.filter(s => 
    s.phone.includes(searchQuery) || 
    s.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-slate-200"></div>
    </div>
  );

  return (
    <div className="w-full space-y-6 min-h-screen">
      <header className="px-1">
        <h1 className="text-2xl text-slate-900 dark:text-slate-50">{t.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.description}</p>
      </header>

      <EditorAlerts error={error} saved={success} />

      <EditorSurface>
        <div className="space-y-10">
          {/* Admin Phones Section */}
          <Panel title={t.adminPhones}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {config.adminPhoneNumbers.map((phone, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{phone}</span>
                  <button 
                    type="button"
                    onClick={() => handleDeletePhone(idx)} 
                    className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddPhone()}
                  placeholder={t.placeholderPhone}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
                />
                <button 
                  type="button"
                  onClick={handleAddPhone} 
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white active:scale-95 transition-transform dark:bg-slate-200 dark:text-slate-900"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Panel>

          {/* Submissions Section - Full Width */}
          <Panel title={t.all}>
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
              />
            </div>

            <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">{t.noSubmissions}</p>
                </div>
              ) : (
                filtered.map(s => {
                  const isOpen = selectedSubmission?._id === s._id;
                  return (
                    <div key={s._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedSubmission(isOpen ? null : s)}
                        className={`w-full text-left py-4 px-2 transition-colors ${isOpen ? "bg-slate-50 dark:bg-slate-800/40" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                          <span className="text-sm text-slate-900 dark:text-slate-100">{s.phone}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">{new Date(s.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">{s.message.substring(0, 100)}{s.message.length > 100 ? "..." : ""}</div>
                      </button>
                      {isOpen && (
                        <div className="px-2 pb-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/20">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {s.name && (
                              <div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Name</span>
                                <p className="text-slate-900 dark:text-slate-100">{s.name}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">Phone</span>
                              <p className="text-slate-900 dark:text-slate-100">{s.phone}</p>
                            </div>
                            {s.email && (
                              <div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Email</span>
                                <p className="text-slate-900 dark:text-slate-100">{s.email}</p>
                              </div>
                            )}
                            {s.subject && (
                              <div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Subject</span>
                                <p className="text-slate-900 dark:text-slate-100">{s.subject}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">Message</span>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{s.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </div>
      </EditorSurface>
    </div>
  );
}
