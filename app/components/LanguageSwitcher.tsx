"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [lang, setLangState] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved) setLangState(saved);
  }, []);

  function setLang(lang: string) {
    localStorage.setItem("lang", lang);
    window.location.reload();
  }

  function style(l: string) {
    return {
      opacity: lang === l ? 1 : 0.5,
      fontWeight: lang === l ? "bold" : "normal",
    };
  }

  return (
    <div className="row" style={{ gap: 6 }}>
      <button
        className="button secondary"
        style={style("fr")}
        onClick={() => setLang("fr")}
      >
        🇫🇷
      </button>

      <button
        className="button secondary"
        style={style("nl")}
        onClick={() => setLang("nl")}
      >
        🇳🇱
      </button>

      <button
        className="button secondary"
        style={style("de")}
        onClick={() => setLang("de")}
      >
        🇩🇪
      </button>
    </div>
  );
}
