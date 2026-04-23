"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password !== password2) {
      alert("Les deux mots de passe ne correspondent pas.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Mot de passe mis à jour ✅");
    window.location.href = "/";
  }

  return (
    <main className="card">
      <h1 className="h1">Réinitialiser le mot de passe</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 500 }}
      >
        <input
          className="input"
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          className="input"
          type="password"
          placeholder="Confirmer le mot de passe"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />

        <button className="button" type="submit">
          Enregistrer le nouveau mot de passe
        </button>
      </form>
    </main>
  );
}
