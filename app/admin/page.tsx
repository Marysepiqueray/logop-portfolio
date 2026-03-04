"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [membres, setMembres] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);

  const [searchMembre, setSearchMembre] = useState("");
  const [searchFormation, setSearchFormation] = useState("");

  const [selectedMembre, setSelectedMembre] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("");

  // Création formation (complet)
  const [titreFormation, setTitreFormation] = useState("");
  const [dureeFormation, setDureeFormation] = useState<number>(0);
  const [niveauFormation, setNiveauFormation] = useState("");
  const [descriptionFormation, setDescriptionFormation] = useState("");
  const [competencesFormation, setCompetencesFormation] = useState("");

  async function loadData() {
    const { data: m, error: me } = await supabase.from("membres").select("*");
    const { data: f, error: fe } = await supabase.from("formations").select("*");

const { data: v, error: ve } = await supabase
 .from("validations")
.select("id, date_validation, membres!membre_id(nom, email), formations(titre)")
.order("date_validation", { ascending: false })
.limit(15);
      .order("date_validation", { ascending: false })
      .limit(15);

    if (me) alert(me.message);
    if (fe) alert(fe.message);
    if (ve) alert(ve.message);

    setMembres(m ?? []);
    setFormations(f ?? []);
    setValidations(v ?? []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const nbMembres = useMemo(() => membres.filter((m) => m.role === "membre").length, [membres]);
  const limite = 300;

  async function createFormation() {
    if (!titreFormation.trim()) return alert("Titre obligatoire.");

    const { error } = await supabase.from("formations").insert({
      titre: titreFormation.trim(),
      duree_heures: Number(dureeFormation ?? 0),
      niveau: niveauFormation.trim(),
      description: descriptionFormation.trim(),
      competences: competencesFormation.trim(),
    });

    if (error) return alert(error.message);

    setTitreFormation("");
    setDureeFormation(0);
    setNiveauFormation("");
    setDescriptionFormation("");
    setCompetencesFormation("");

    await loadData();
    alert("Formation créée ✅");
  }

  async function validateFormation() {
    if (!selectedMembre || !selectedFormation) {
      alert("Choisir membre et formation");
      return;
    }

    // Anti-doublon
    const { data: exist, error: exErr } = await supabase
      .from("validations")
      .select("id")
      .eq("membre_id", selectedMembre)
      .eq("formation_id", selectedFormation);

    if (exErr) return alert(exErr.message);
    if (exist && exist.length > 0) {
      alert("Formation déjà validée pour ce membre ✅");
      return;
    }

    const { error } = await supabase.from("validations").insert({
      membre_id: selectedMembre,
      formation_id: selectedFormation,
    });

    if (error) return alert(error.message);

    alert("Validation enregistrée ✅");
    await loadData();
  }

  const membresFiltres = useMemo(() => {
    const q = searchMembre.toLowerCase().trim();
    const base = membres.filter((m) => m.role === "membre"); // uniquement membres
    if (!q) return base;
    return base.filter((m) => `${m.nom} ${m.email}`.toLowerCase().includes(q));
  }, [membres, searchMembre]);

  const formationsFiltrees = useMemo(() => {
    const q = searchFormation.toLowerCase().trim();
    if (!q) return formations;
    return formations.filter((f) => (f.titre ?? "").toLowerCase().includes(q));
  }, [formations, searchFormation]);

  return (
    <main className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>
          Administration
        </h1>
        <span className="badge">
          Membres : <b>{nbMembres}</b> / {limite}
        </span>
      </div>

      <hr className="hr" />

      <h2>Créer une formation</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <input
          className="input"
          placeholder="Titre"
          value={titreFormation}
          onChange={(e) => setTitreFormation(e.target.value)}
        />

        <div className="row">
          <input
            className="input"
            type="number"
            placeholder="Durée (heures)"
            value={dureeFormation}
            onChange={(e) => setDureeFormation(Number(e.target.value))}
          />
          <input
            className="input"
            placeholder="Niveau (optionnel)"
            value={niveauFormation}
            onChange={(e) => setNiveauFormation(e.target.value)}
          />
        </div>

        <textarea
          className="input"
          placeholder="Description"
          value={descriptionFormation}
          onChange={(e) => setDescriptionFormation(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Compétences (séparées par virgules)"
          value={competencesFormation}
          onChange={(e) => setCompetencesFormation(e.target.value)}
        />

        <button className="button" onClick={createFormation}>
          Ajouter la formation
        </button>
      </div>

      <hr className="hr" />

      <h2>Valider une formation</h2>

      <div className="row" style={{ marginBottom: 10 }}>
        <input
          className="input"
          placeholder="Rechercher membre (nom/email)"
          value={searchMembre}
          onChange={(e) => setSearchMembre(e.target.value)}
        />
        <input
          className="input"
          placeholder="Rechercher formation (titre)"
          value={searchFormation}
          onChange={(e) => setSearchFormation(e.target.value)}
        />
      </div>

      <div className="row">
        <select className="input" value={selectedMembre} onChange={(e) => setSelectedMembre(e.target.value)}>
          <option value="">Choisir un membre</option>
          {membresFiltres.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nom} — {m.email}
            </option>
          ))}
        </select>

        <select className="input" value={selectedFormation} onChange={(e) => setSelectedFormation(e.target.value)}>
          <option value="">Choisir une formation</option>
          {formationsFiltrees.map((f) => (
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}
        </select>

        <button className="button" disabled={!selectedMembre || !selectedFormation} onClick={validateFormation}>
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
            {v.membres?.nom} — {v.formations?.titre}
          </div>
        ))
      )}
    </main>
  );
}
