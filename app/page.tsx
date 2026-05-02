"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import InstallAppButton from "./components/InstallAppButton";

const labels = {
  fr: {
    title: "Connexion",
    install: "Installer l’application",
    memberLogin: "Connexion membre",
    email: "Votre email",
    password: "Mot de passe",
    login: "Se connecter",
    forgot: "Mot de passe oublié ?",
    magicIntro: "Ou recevoir un lien magique :",
    magicButton: "Envoyer le lien magique",
    sent: "Lien envoyé ✅ Vérifiez votre boîte mail.",
    admin: "Admin :",
    adminLink: "accéder à l’espace admin",
    connected: "Connecté en tant que :",
    mySpace: "Mon espace",
    adminSpace: "Espace admin",
    logout: "Déconnexion",
    emailRequired: "Veuillez d’abord entrer votre email.",
    resetSent: "Email de réinitialisation envoyé ✅ Vérifiez votre boîte mail.",
  },
  nl: {
    title: "Aanmelden",
    install: "App installeren",
    memberLogin: "Ledenlogin",
    email: "Uw e-mailadres",
    password: "Wachtwoord",
    login: "Aanmelden",
    forgot: "Wachtwoord vergeten?",
    magicIntro: "Of ontvang een magische link:",
    magicButton: "Magische link verzenden",
    sent: "Link verzonden ✅ Controleer uw mailbox.",
    admin: "Admin:",
    adminLink: "naar de adminruimte",
    connected: "Aangemeld als:",
    mySpace: "Mijn ruimte",
    adminSpace: "Adminruimte",
    logout: "Afmelden",
    emailRequired: "Vul eerst uw e-mailadres in.",
    resetSent: "Resetmail verzonden ✅ Controleer uw mailbox.",
  },
  de: {
    title: "Anmeldung",
    install: "App installieren",
    memberLogin: "Mitglieder-Login",
    email: "Ihre E-Mail-Adresse",
    password: "Passwort",
    login: "Anmelden",
    forgot: "Passwort vergessen?",
    magicIntro: "Oder einen Magic Link erhalten:",
    magicButton: "Magic Link senden",
    sent: "Link gesendet ✅ Bitte prüfen Sie Ihr Postfach.",
    admin: "Admin:",
    adminLink: "zum Adminbereich",
    connected: "Angemeldet als:",
    mySpace: "Mein Bereich",
    adminSpace: "Adminbereich",
    logout: "Abmelden",
    emailRequired: "Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.",
    resetSent: "E-Mail zum Zurücksetzen gesendet ✅ Bitte prüfen Sie Ihr Postfach.",
  },
};

export default function HomePage() {
  const [lang, setLang] = useState<"fr" | "nl" | "de">("fr");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "fr" | "nl" | "de" | null;
    if (savedLang === "fr" || savedLang === "nl" || savedLang === "de") {
      setLang(savedLang);
    }

    supabase.auth.getUser().then(({ data }) => {
      setSessionEmail(data.user?.email ?? null);
    });
  }, []);

  const t = labels[lang];

  async function sendMagicLink(e: FormEvent) {
    e.preventDefault();
    setSent(false);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? window.location.origin
            : undefined,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  }

  async function loginPassword(e: FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  async function resetPassword() {
    if (!email) {
      alert(t.emailRequired);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert(t.resetSent);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSessionEmail(null);
    setSent(false);
  }

  return (
    <main className="card">
      <h1 className="h1">{t.title}</h1>

      <div className="row" style={{ marginBottom: 16 }}>
        <InstallAppButton />
      </div>

      {!sessionEmail ? (
        <>
          <p className="p">{t.memberLogin}</p>

          <form className="row" onSubmit={loginPassword}>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email}
              type="email"
              required
            />

            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              type="password"
            />

            <button className="button" type="submit">
              {t.login}
            </button>
          </form>

          <p className="small" style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={resetPassword}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#1d4ed8",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              {t.forgot}
            </button>
          </p>

          <p className="small" style={{ marginTop: 12 }}>
            {t.magicIntro}
          </p>

          <form onSubmit={sendMagicLink} className="row">
            <button className="button secondary" type="submit">
              {t.magicButton}
            </button>
          </form>

          {sent && (
            <p className="small" style={{ marginTop: 12 }}>
              {t.sent}
            </p>
          )}

          <hr className="hr" />

          <p className="p">
            {t.admin}{" "}
            <a href="/admin">
              <b>{t.adminLink}</b>
            </a>
          </p>
        </>
      ) : (
        <>
          <p className="p">
            {t.connected} <b>{sessionEmail}</b>
          </p>

          <div className="row">
            <a className="button secondary" href="/me">
              {t.mySpace}
            </a>

            <a className="button secondary" href="/admin">
              {t.adminSpace}
            </a>

            <button className="button" onClick={logout}>
              {t.logout}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
