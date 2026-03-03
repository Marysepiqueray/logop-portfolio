"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSessionEmail(data.user?.email ?? null));
  }, []);

  async function sendMagicLink(e: FormEvent) {
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
    <main className="card">
      <h1 className="h1">Connexion</h1>

      {!sessionEmail ? (
        <>
          <p className="p">Connexion membre via lien magique (email).</p>

          <form onSubmit={sendMagicLink} className="row">
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              type="email"
              required
            />
            <button className="button" type="submit">
              Envoyer le lien
            </button>
          </form>

          {sent && <p className="small" style={{ marginTop: 12 }}>Lien envoyé ✅ Vérifiez votre boîte mail.</p>}

          <hr className="hr" />
          <p className="p">
            Admin : <a href="/admin"><b>accéder à l’espace admin</b></a>
          </p>
        </>
      ) : (
        <>
          <p className="p">
            Connecté en tant que : <b>{sessionEmail}</b>
          </p>
          <div className="row">
            <a className="button secondary" href="/me">Mon espace</a>
            <a className="button secondary" href="/admin">Espace admin</a>
            <button className="button" onClick={logout}>Déconnexion</button>
          </div>
        </>
      )}
    </main>
  );
