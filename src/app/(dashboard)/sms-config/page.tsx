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
    <div className="flex h-[80vh] items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800"></div>
    </div>
  );

  return (
    <div className="space-y-8 bg-white min-h-screen p-2 sm:p-0">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t.title}</h1>
        <p className="mt-1 text-slate-500 font-medium">{t.description}</p>
      </header>

      <EditorAlerts error={error} saved={success} />

      <EditorSurface>
        <div className="space-y-12">
          {/* Admin Phones Section - Full Width */}
          <Panel title={t.adminPhones}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.adminPhoneNumbers.map((phone, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-900">{phone}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeletePhone(idx)} 
                    className="rounded-lg p-2 text-slate-300 hover:text-red-600 hover:bg-white transition-all"
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
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
                <button 
                  type="button"
                  onClick={handleAddPhone} 
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white active:scale-95 transition-transform shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Panel>

          {/* Submissions Section - Full Width List */}
          <Panel title={t.all}>
            <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm outline-none focus:bg-white focus:border-slate-400"
              />
            </div>

            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Inbox className="h-10 w-10 mb-4 opacity-10" />
                  <p className="text-sm font-bold">{t.noSubmissions}</p>
                </div>
              ) : (
                filtered.map(s => (
                  <div key={s._id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-900 font-bold">
                          #
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{s.phone}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {new Date(s.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {s.email && (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-100">
                          <Mail className="h-3.5 w-3.5" />
                          {s.email}
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-50">
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                        {s.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </EditorSurface>
    </div>
  );
}
