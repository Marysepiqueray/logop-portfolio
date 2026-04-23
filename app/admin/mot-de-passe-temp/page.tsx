"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminTempPasswordPage() {
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage("Vous devez être connectée en admin.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/set-temp-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email,
        temporaryPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Erreur.");
      setLoading(false);
      return;
    }

    setMessage("Mot de passe temporaire créé ✅");
    setLoading(false);
    setEmail("");
    setTemporaryPassword("");
  }

  return (
    <main className="card">
      <h1 className="h1">Créer un mot de passe temporaire</h1>

      <p className="p">
        Réservé à l’administratrice. À utiliser uniquement pour aider un membre
        bloqué.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 520 }}
      >
        <input
          className="input"
          type="email"
          placeholder="Email du membre"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input"
          type="text"
          placeholder="Mot de passe temporaire"
          value={temporaryPassword}
          onChange={(e) => setTemporaryPassword(e.target.value)}
          required
        />

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer le mot de passe temporaire"}
        </button>
      </form>

      {message ? (
        <p className="small" style={{ marginTop: 12 }}>
          {message}
        </p>
      ) : null}
    </main>
  );
}
