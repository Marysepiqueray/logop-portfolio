"use client";

import { useEffect, useState } from "react";

const labels = {
  fr: {
    install: "Installer l’application",
    iphone:
      "Sur iPhone : ouvrez dans Safari puis Partager > Ajouter à l’écran d’accueil.",
    browser: "Installation disponible depuis le navigateur.",
  },
  nl: {
    install: "App installeren",
    iphone:
      "Op iPhone: open in Safari en kies Delen > Zet op beginscherm.",
    browser: "Installatie beschikbaar via de browser.",
  },
  de: {
    install: "App installieren",
    iphone:
      "Auf dem iPhone: in Safari öffnen und dann Teilen > Zum Home-Bildschirm.",
    browser: "Installation über den Browser verfügbar.",
  },
};

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIphone, setIsIphone] = useState(false);
  const [lang, setLang] = useState<"fr" | "nl" | "de">("fr");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as
      | "fr"
      | "nl"
      | "de"
      | null;

    if (savedLang === "fr" || savedLang === "nl" || savedLang === "de") {
      setLang(savedLang);
    }

    const ua = window.navigator.userAgent.toLowerCase();

    if (
      /iphone|ipad|ipod/.test(ua) &&
      !(window.navigator as any).standalone
    ) {
      setIsIphone(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const t = labels[lang];

  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIphone) {
      alert(t.iphone);
      return;
    }

    alert(t.browser);
  }

  return (
    <button className="button" onClick={installApp}>
      📲 {t.install}
    </button>
  );
}
