"use client";

export default function LanguageSwitcher() {
  function setLang(lang: string) {
    localStorage.setItem("lang", lang);
    window.location.reload();
  }

  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="button secondary" onClick={() => setLang("fr")}>
        FR
      </button>
      <button className="button secondary" onClick={() => setLang("nl")}>
        NL
      </button>
      <button className="button secondary" onClick={() => setLang("de")}>
        DE
      </button>
    </div>
  );
}
