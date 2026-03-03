"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

type Formation = {
  id: string;
  titre: string;
  description: string;
  competences: string;
  duree_heures: number;
  niveau: string;
};

type Membre = {
  id: string;
  nom: string;
  email: string;
  role: "admin" | "membre";
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [formations, setFormations] = useState<Formation[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);

  const [newFormation, setNewFormation] = useState<Partial<Formation>>({
    duree_heures: 0,
  });

  const [newMembre, setNewMembre] = useState<Partial<Membre>>({});

  const [selectedMembreId, setSelectedMembreId] = useState("");
  const [selectedFormationId, setSelectedFormationId] = useState("");

  async function refresh() {
    const { data: f } = await supabase
      .from("formations")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: m } = await supabase
      .from("membres")
      .select("id, nom, email, role")
      .order("created_at", { ascending: false });

    setFormations((f ?? []) as any);
    setMembres((m ?? []) as any);
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

  async function createFormation() {
    await supabase.from("formations").insert([
      {
        titre: newFormation.titre ?? "",
        description: newFormation.description ?? "",
        competences: newFormation.competences ?? "",
        duree_heures: Number(newFormation.duree_heures ?? 0),
        niveau: newFormation.niveau ?? "",
      },
    ]);

    setNewFormation({ duree_heures: 0 });
    await refresh();
  }

  async function createMembre() {
    await supabase.from("membres").insert([
      {
        nom: newMembre.nom ?? "",
        email: (newMembre.email ?? "").toLowerCase(),
        role: "membre",
      },
    ]);

    setNewMembre({});
    await refresh();
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
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1 className="h1" style={{ marginBottom: 0 }}>
            Admin
          </h1>
          <a className="button secondary" href="/">
            Retour accueil
          </a>
        </div>

        <p className="p">Connexion administrateur.</p>

        <form onSubmit={adminLogin} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
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
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>
          Espace admin
        </h1>
        <div className="row">
          <a className="button secondary" href="/">
            Retour accueil
          </a>
          <button className="button" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </div>

      <hr className="hr" />

      <h2>Créer une formation</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        <input
          className="input"
          placeholder="Titre"
          value={newFormation.titre ?? ""}
          onChange={(e) => setNewFormation((s) => ({ ...s, titre: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Durée (heures)"
          type="number"
          value={String(newFormation.duree_heures ?? 0)}
          onChange={(e) => setNewFormation((s) => ({ ...s, duree_heures: Number(e.target.value) }))}
        />
        <textarea
          className="input"
          placeholder="Description"
          value={newFormation.description ?? ""}
          onChange={(e) => setNewFormation((s) => ({ ...s, description: e.target.value }))}
        />
        <textarea
          className="input"
          placeholder="Compétences (séparées par virgules)"
          value={newFormation.competences ?? ""}
          onChange={(e) => setNewFormation((s) => ({ ...s, competences: e.target.value }))}
        />
        <button className="button" onClick={createFormation}>
          Créer
        </button>
      </div>

      <hr className="hr" />

      <h2>Ajouter un membre</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 400 }}>
        <input
          className="input"
          placeholder="Nom"
          value={newMembre.nom ?? ""}
          onChange={(e) => setNewMembre((s) => ({ ...s, nom: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={newMembre.email ?? ""}
          onChange={(e) => setNewMembre((s) => ({ ...s, email: e.target.value }))}
        />
        <button className="button" onClick={createMembre}>
          Ajouter
        </button>
      </div>

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
                {m.nom} — {m.email}
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
