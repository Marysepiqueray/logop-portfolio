"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [membres, setMembres] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);

  const [searchMembre, setSearchMembre] = useState("");
  const [searchFormation, setSearchFormation] = useState("");

  const [selectedMembre, setSelectedMembre] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("");

  const [titreFormation, setTitreFormation] = useState("");
  const [dureeFormation, setDureeFormation] = useState(0);
  const [niveauFormation, setNiveauFormation] = useState("");
  const [descriptionFormation, setDescriptionFormation] = useState("");
  const [competencesFormation, setCompetencesFormation] = useState("");

  async function loadData() {
    const { data: m, error: me } = await supabase.from("membres").select("*");
    const { data: f, error: fe } = await supabase.from("formations").select("*");

    const { data: v, error: ve } = await supabase
      .from("validations")
      .select("id, date_validation, membres!membre_id(nom, email), validateur:membres!valide_par(nom), formations(titre)")
      .order("date_validation", { ascending: false })
      .limit(15);

    if (me) alert(me.message);
    if (fe) alert(fe.message);
    if (ve) alert(ve.message);

    setMembres(m ?? []);
    setFormations(f ?? []);
    setValidations(v ?? []);
  }

  // ✅ Bloque /admin pour les non-admin
  useEffect(() => {
    async function checkAdminThenLoad() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        window.location.href = "/";
        return;
      }

      const { data: row, error } = await supabase
        .from("membres")
        .select("role")
        .eq("auth_id", userId)
        .maybeSingle();

      if (error || !row || row.role !== "admin") {
        window.location.href = "/";
        return;
      }

      await loadData();
    }

    checkAdminThenLoad();
  }, []);

  async function createFormation() {
    if (!titreFormation.trim()) {
      alert("Titre obligatoire");
      return;
    }

    const { error } = await supabase.from("formations").insert({
      titre: titreFormation,
      duree_heures: Number(dureeFormation ?? 0),
      niveau: niveauFormation,
      description: descriptionFormation,
      competences: competencesFormation,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitreFormation("");
    setDureeFormation(0);
    setNiveauFormation("");
    setDescriptionFormation("");
    setCompetencesFormation("");

    await loadData();
    alert("Formation ajoutée ✅");
  }

  async function validateFormation() {
    if (!selectedMembre || !selectedFormation) {
      alert("Choisir membre et formation");
      return;
    }

    // anti-doublon
    const { data: exist, error: exErr } = await supabase
      .from("validations")
      .select("id")
      .eq("membre_id", selectedMembre)
      .eq("formation_id", selectedFormation);

    if (exErr) {
      alert(exErr.message);
      return;
    }
    if (exist && exist.length > 0) {
      alert("Formation déjà validée pour ce membre ✅");
      return;
    }

    // récupérer l'ID de l'admin pour valide_par
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { data: adminRow } = await supabase
      .from("membres")
      .select("id")
      .eq("auth_id", userId)
      .maybeSingle();

    const { error } = await supabase.from("validations").insert({
      membre_id: selectedMembre,
      formation_id: selectedFormation,
      valide_par: adminRow?.id ?? null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Validation enregistrée ✅");
    await loadData();
  }

  const membresFiltres = membres
    .filter((m) => m.role === "membre")
    .filter((m) => (m.nom + " " + m.email).toLowerCase().includes(searchMembre.toLowerCase()));

  const formationsFiltrees = formations.filter((f) =>
    (f.titre ?? "").toLowerCase().includes(searchFormation.toLowerCase())
  );

  const nombreMembres = membres.filter((m) => m.role === "membre").length;

  return (
    <main className="card">
      <h1 className="h1">Administration</h1>

      <div className="small">Membres inscrits : {nombreMembres} / 300</div>

      <hr className="hr" />

      <h2>Créer une formation</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        <input className="input" placeholder="Titre" value={titreFormation} onChange={(e) => setTitreFormation(e.target.value)} />

        <input
          className="input"
          type="number"
          placeholder="Durée (heures)"
          value={dureeFormation}
          onChange={(e) => setDureeFormation(Number(e.target.value))}
        />

        <input className="input" placeholder="Niveau" value={niveauFormation} onChange={(e) => setNiveauFormation(e.target.value)} />

        <textarea className="input" placeholder="Description" value={descriptionFormation} onChange={(e) => setDescriptionFormation(e.target.value)} />

        <textarea className="input" placeholder="Compétences" value={competencesFormation} onChange={(e) => setCompetencesFormation(e.target.value)} />

        <button className="button" onClick={createFormation}>
          Ajouter la formation
        </button>
      </div>

      <hr className="hr" />

      <h2>Valider une formation</h2>

      <div className="row">
        <input className="input" placeholder="Rechercher membre" value={searchMembre} onChange={(e) => setSearchMembre(e.target.value)} />

        <input
          className="input"
          placeholder="Rechercher formation"
          value={searchFormation}
          onChange={(e) => setSearchFormation(e.target.value)}
        />
      </div>

      <div className="row">
        <select className="input" value={selectedMembre} onChange={(e) => setSelectedMembre(e.target.value)}>
          <option value="">Choisir membre</option>
          {membresFiltres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom} — {m.email}
            </option>
          ))}
        </select>

        <select className="input" value={selectedFormation} onChange={(e) => setSelectedFormation(e.target.value)}>
          <option value="">Choisir formation</option>
          {formationsFiltrees.map((f) => (
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}
        </select>

        <button className="button" onClick={validateFormation}>
          Valider
        </button>
      </div>

      <hr className="hr" />

      <h2>Validations récentes</h2>

      {validations.length === 0 ? (
        <p className="p">Aucune validation récente.</p>
      ) : (
        validations.map((v) => (
          <div key={v.id} className="small" style={{ marginBottom: 6 }}>
            {v.membres?.nom} — {v.formations?.titre} (validé par {v.validateur?.nom})
          </div>
        ))
      )}
    </main>
  );
}
