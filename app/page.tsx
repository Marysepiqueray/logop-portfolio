"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionEmail(data.user?.email ?? null);
    });
  }, []);

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
      alert("Veuillez d’abord entrer votre email.");
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

    alert("Email de réinitialisation envoyé ✅ Vérifiez votre boîte mail.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setSessionEmail(null);
    setSent(false);
  }

  return (
    <main className="card">
      <h1 className="h1">Connexion</h1>

      {!sessionEmail ? (
        <>
          <p className="p">Connexion membre</p>

          <form className="row" onSubmit={loginPassword}>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              type="email"
              required
            />

            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              type="password"
            />

            <button className="button" type="submit">
              Se connecter
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
              Mot de passe oublié ?
            </button>
          </p>

          <p className="small" style={{ marginTop: 12 }}>
            Ou recevoir un lien magique :
          </p>

          <form onSubmit={sendMagicLink} className="row">
            <button className="button secondary" type="submit">
              Envoyer le lien magique
            </button>
          </form>

          {sent && (
            <p className="small" style={{ marginTop: 12 }}>
              Lien envoyé ✅ Vérifiez votre boîte mail.
            </p>
          )}

          <hr className="hr" />

          <p className="p">
            Admin :{" "}
            <a href="/admin">
              <b>accéder à l’espace admin</b>
            </a>
          </p>
        </>
      ) : (
        <>
          <p className="p">
            Connecté en tant que : <b>{sessionEmail}</b>
          </p>

          <div className="row">
            <a className="button secondary" href="/me">
              Mon espace
            </a>

            <a className="button secondary" href="/admin">
              Espace admin
            </a>

            <button className="button" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </>
      )}
    </main>
  );
}
