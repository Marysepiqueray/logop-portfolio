"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSessionEmail(data.user?.email ?? null));
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setSent(false);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });

    if (error) {
      alert(error.message);
      return;
    }
    setSent(true);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSessionEmail(null);
    setSent(false);
  }

  return (
    <main>
      <h1>Portfolio – Logop’Aide et vous</h1>

      {!sessionEmail ? (
        <>
          <p>Connexion membre via lien magique (email).</p>

          <form onSubmit={sendMagicLink} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              type="email"
              required
              style={{ padding: 10, minWidth: 280 }}
            />
            <button type="submit" style={{ padding: "10px 14px" }}>
              Envoyer le lien
            </button>
          </form>

          {sent && <p style={{ marginTop: 12 }}>Lien envoyé ✅ Vérifiez votre boîte mail.</p>}

          <hr style={{ margin: "24px 0" }} />
          <p>
            Admin : <a href="/admin">accéder à l’espace admin</a>
          </p>
        </>
      ) : (
        <>
          <p>
            Connecté en tant que : <b>{sessionEmail}</b>
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/me">Accéder à mon espace</a>
            <a href="/admin">Espace admin</a>
            <button onClick={logout} style={{ padding: "6px 10px" }}>
              Déconnexion
            </button>
          </div>
        </>
      )}
    </main>
  );
}
