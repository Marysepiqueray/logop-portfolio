"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [formations, setFormations] = useState<any[]>([]);
  const [membres, setMembres] = useState<any[]>([]);

  const [selectedMembreId, setSelectedMembreId] = useState("");
  const [selectedFormationId, setSelectedFormationId] = useState("");

  async function refresh() {
    const { data: f } = await supabase.from("formations").select("*");
    const { data: m } = await supabase.from("membres").select("*");

    setFormations(f ?? []);
    setMembres(m ?? []);
  }

  async function checkAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setIsAdmin(false);
      return;
    }

    const { data: me } = await supabase
      .from("membres")
      .select("role")
      .eq("auth_id", userId)
      .maybeSingle();

    const ok = me?.role === "admin";
    setIsAdmin(ok);
    if (ok) await refresh();
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  async function adminLogin(e: FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/admin";
  }

  async function logout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }

  async function validateFormation() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { data: adminRow } = await supabase
      .from("membres")
      .select("id")
      .eq("auth_id", userId)
      .maybeSingle();

    if (!adminRow) {
      alert("Admin introuvable.");
      return;
    }

    await supabase.from("validations").insert([
      {
        membre_id: selectedMembreId,
        formation_id: selectedFormationId,
        valide_par: adminRow.id,
      },
    ]);

    alert("Validation enregistrée ✅");
  }

  if (isAdmin === null) return <main className="card">Chargement…</main>;

  if (!isAdmin) {
    return (
      <main className="card">
        <h1 className="h1">Admin</h1>
        <p className="p">Connexion administrateur</p>

        <form onSubmit={adminLogin} style={{ display: "grid", gap: 10 }}>
          <input
            className="input"
            type="email"
            placeholder="Email admin"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Mot de passe"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
          <button className="button" type="submit">
            Se connecter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="card">
      <h1 className="h1">Espace admin</h1>

      <button className="button secondary" onClick={logout}>
        Déconnexion
      </button>

      <hr className="hr" />

      <h2>Valider une formation</h2>

      <div className="row">
        <select
          className="input"
          value={selectedMembreId}
          onChange={(e) => setSelectedMembreId(e.target.value)}
        >
          <option value="">Choisir un membre</option>
          {membres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom} — {m.email} ({m.role})
            </option>
          ))}
        </select>

        <select
          className="input"
          value={selectedFormationId}
          onChange={(e) => setSelectedFormationId(e.target.value)}
        >
          <option value="">Choisir une formation</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}
        </select>

        <button
          className="button"
          disabled={!selectedMembreId || !selectedFormationId}
          onClick={validateFormation}
        >
          Valider
        </button>
      </div>
    </main>
  );
}
