"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import LanguageSwitcher from "./LanguageSwitcher";

const labels = {
  fr: {
    home: "Accueil",
    portfolio: "Mon portfolio",
    directory: "Annuaire",
    map: "Carte",
    admin: "Admin",
    site: "Site ASBL",
  },
  nl: {
    home: "Home",
    portfolio: "Mijn portfolio",
    directory: "Gids",
    map: "Kaart",
    admin: "Admin",
    site: "Website",
  },
  de: {
    home: "Start",
    portfolio: "Mein Portfolio",
    directory: "Verzeichnis",
    map: "Karte",
    admin: "Admin",
    site: "Website",
  },
};

export default function NavBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [lang, setLang] = useState("fr");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "fr";
    setLang(savedLang);

    async function checkRole() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) return;

      const { data: membre } = await supabase
        .from("membres")
        .select("role")
        .eq("auth_id", userId)
        .maybeSingle();

      if (membre?.role === "admin") setIsAdmin(true);
    }

    checkRole();
  }, []);

  const t = labels[lang as keyof typeof labels];

  return (
    <>
      <nav className="navbar">
        <a href="/">{t.home}</a>
        <a href="/me">{t.portfolio}</a>
        <a href="/annuaire">{t.directory}</a>
        <a href="/carte">{t.map}</a>

        <a
          href="https://www.logopaidetvous.be/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.site}
        </a>

        {isAdmin && <a href="/admin">{t.admin}</a>}

        
      </nav>

      <nav className="mobile-tabbar">
        <a href="/">🏠<span>{t.home}</span></a>
        <a href="/me">🎓<span>{t.portfolio}</span></a>
        <a href="/annuaire">🔎<span>{t.directory}</span></a>
        <a href="/carte">🗺️<span>{t.map}</span></a>
        {isAdmin && <a href="/admin">⚙️<span>{t.admin}</span></a>}
      </nav>
    </>
  );
}
