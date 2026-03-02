"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Formation = {
  id: string;
  titre: string;
  description: string;
  competences: string;
  duree_heures: number;
  niveau: string;
};

type Membre = { id: string; nom: string; email: string; role: "admin" | "membre" };

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [formations, setFormations] = useState<Formation[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);

  const [newFormation, setNewFormation] = useState<Partial<Formation>>({ duree_heures: 0 });
  const [newMembre, setNewMembre] = useState<Partial<Membre>>({ role: "membre" });

  const [selectedMembreId, setSelectedMembreId] = useState<string>("");
  const [selectedFormationId, setSelectedFormationId] = useState<string>("");

  async function refresh() {
    const { data: f } = await supabase.from("formations").select("*").order("created_at", { ascending: false });
    const { data: m } = await supabase.from("membres").select("id, nom, email, role").order("created_at", { ascending: false });
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
      .select("role, id")
      .eq("auth_id", userId)
      .maybeSingle();

    const ok = me?.role === "admin";
    setIsAdmin(ok);
    if (ok) await refresh();
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  async function adminLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (error) {
      alert(error.message);
      return;
    }
    await checkAdmin();
  }

  async function logout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }

  async function createFormation() {
    const { error } = await supabase.from("formations").insert([
      {
        titre: newFormation.titre ?? "",
        description: newFormation.description ?? "",
        competences: newFormation.competences ?? "",
        duree_heures: Number(newFormation.duree_heures ?? 0),
        niveau: newFormation.niveau ?? ""
      }
    ]);
    if (error) alert(error.message);
    setNewFormation({ duree_heures: 0 });
    await refresh();
  }

  async function createMembre() {
    const { error } = await supabase.from("membres").insert([
      {
        nom: newMembre.nom ?? "",
        email: (newMembre.email ?? "").toLowerCase(),
        role: "membre"
      }
    ]);
    if (error) alert(error.message);
    setNewMembre({ role: "membre" });
    await refresh();
  }

  async function validateFormation() {
    // Trouver l'id "membres.id" de l'admin connecté pour remplir valide_par
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { data: adminRow, error: aErr } = await supabase
      .from("membres")
      .select("id")
      .eq("auth_id", userId)
      .maybeSingle();

    if (aErr || !adminRow) {
      alert("Admin introuvable.");
      return;
    }

    const { error } = await supabase.from("validations").insert([
      {
        membre_id: selectedMembreId,
        formation_id: selectedFormationId,
        valide_par: adminRow.id
      }
    ]);

    if (error) alert(error.message);
    else alert("Validation enregistrée ✅");
  }

  if (isAdmin === null) return <p>Chargement…</p>;

  if (!isAdmin) {
    return (
      <main>
        <h1>Admin</h1>
        <p>Connexion admin (email + mot de passe).</p>

        <form onSubmit={adminLogin} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
          <input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            type="email"
            placeholder="Email admin"
            required
            style={{ padding: 10 }}
          />
          <input
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            type="password"
            placeholder="Mot de passe"
            required
            style={{ padding: 10 }}
          />
          <button type="submit" style={{ padding: "10px 14px" }}>
            Se connecter
          </button>
        </form>

        <p style={{ marginTop: 16 }}>
          <a href="/">Retour</a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Espace admin</h1>
      <button onClick={logout} style={{ padding: "6px 10px" }}>
        Déconnexion
      </button>

      <hr style={{ margin: "18px 0" }} />

      <h2>Créer une formation</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 640 }}>
        <input
          placeholder="Titre"
          value={newFormation.titre ?? ""}
          onChange={(e) => setNewFormation((s) => ({ ...s, titre: e.target.value }))}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Niveau (optionnel)"
          value={newFormation.niveau ?? ""}
          onChange={(e) => setNewFormation((s) => ({ ...s, niveau: e.target.value }))}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Durée (heures)"
          type="number"
          value={String(newFormation.duree_heures ?? 0)}
          onChange={(e) => setNewFormation((s) => ({ ...s, duree_heures: Number(e.target.value) }))}
          style={{ padding: 10 }}
        />
        <textarea
          placeholder="Description"
          value={newFormation.description ?? ""}
          onChange={(e) => setNewFormation((s) => ({ ...s, description: e.target.value }))}
          style={{ padding: 10 }}
        />
        <textarea
          placeholder="Compétences (séparées par virgules)"
          value={newFormation.competences ?? ""}
          onChange={(e) => setNewFormation((s) => ({ ...s, competences: e.target.value }))}
          style={{ padding: 10 }}
        />
        <button onClick={createFormation} style={{ padding: "10px 14px" }}>
          Créer
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Ajouter un membre</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="Nom"
          value={newMembre.nom ?? ""}
          onChange={(e) => setNewMembre((s) => ({ ...s, nom: e.target.value }))}
          style={{ padding: 10 }}
        />
        <input
          placeholder="Email"
          type="email"
          value={newMembre.email ?? ""}
          onChange={(e) => setNewMembre((s) => ({ ...s, email: e.target.value }))}
          style={{ padding: 10 }}
        />
        <button onClick={createMembre} style={{ padding: "10px 14px" }}>
          Ajouter
        </button>
        <small>Le membre pourra ensuite se connecter via lien magique avec cet email.</small>
      </div>

      <h2 style={{ marginTop: 24 }}>Valider une formation</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={selectedMembreId} onChange={(e) => setSelectedMembreId(e.target.value)} style={{ padding: 10 }}>
          <option value="">Choisir un membre</option>
          {membres
            .filter((m) => m.role === "membre")
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom} — {m.email}
              </option>
            ))}
        </select>

        <select value={selectedFormationId} onChange={(e) => setSelectedFormationId(e.target.value)} style={{ padding: 10 }}>
          <option value="">Choisir une formation</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}
        </select>

        <button
          onClick={validateFormation}
          disabled={!selectedMembreId || !selectedFormationId}
          style={{ padding: "10px 14px" }}
        >
          Valider
        </button>
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2>Liste formations</h2>
      <ul>
        {formations.map((f) => (
          <li key={f.id}>
            <b>{f.titre}</b> — {f.duree_heures}h — {f.niveau || "—"}
          </li>
        ))}
      </ul>
    </main>
  );
}
