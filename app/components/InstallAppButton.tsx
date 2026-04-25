"use client";

import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIphone, setIsIphone] = useState(false);

  useEffect(() => {
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

  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIphone) {
      alert(
        "Sur iPhone : ouvrez dans Safari puis Partager > Ajouter à l’écran d’accueil."
      );
      return;
    }

    alert("Installation disponible depuis le navigateur.");
  }

  return (
    <button className="button" onClick={installApp}>
      📲 Installer l’application
    </button>
  );
}
