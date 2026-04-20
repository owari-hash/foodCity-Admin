"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { adminTranslations, AdminTranslations } from "@/lib/admin-translations";

type Lang = "mn" | "en";

type AdminLanguageContextType = {
  lang: Lang;
  t: AdminTranslations;
  toggle: () => void;
};

const AdminLanguageContext = createContext<AdminLanguageContextType>({
  lang: "mn",
  t: adminTranslations.mn,
  toggle: () => {},
});

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("mn");

  useEffect(() => {
    // Check cookie first (standard for server/client sync)
    const matches = document.cookie.match(/admin-lang=(mn|en)/);
    const cookieLang = matches ? (matches[1] as Lang) : null;
    
    // Check localStorage second
    const stored = localStorage.getItem("admin-lang") as Lang | null;
    
    if (cookieLang) {
      setLang(cookieLang);
    } else if (stored === "en" || stored === "mn") {
      setLang(stored);
      // Sync to cookie
      document.cookie = `admin-lang=${stored};path=/;max-age=31536000;SameSite=Lax`;
    }
  }, []);

  const toggle = () => {
    const next: Lang = lang === "mn" ? "en" : "mn";
    setLang(next);
    localStorage.setItem("admin-lang", next);
    // Set cookie for server components
    document.cookie = `admin-lang=${next};path=/;max-age=31536000;SameSite=Lax`;
    // Reload the page to ensure all components fetch the new language data
    window.location.reload();
  };

  return (
    <AdminLanguageContext.Provider
      value={{
        lang,
        t: adminTranslations[lang],
        toggle,
      }}
    >
      {children}
    </AdminLanguageContext.Provider>
  );
}

export const useAdminLanguage = () => useContext(AdminLanguageContext);
