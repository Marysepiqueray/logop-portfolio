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

    const { data: m } = await supabase
      .from("membres")
      .select("*");

    const { data: f } = await supabase
      .from("formations")
      .select("*");

    const { data: v } = await supabase
      .from("validations")
      .select(
        "id, date_validation, membres!membre_id(nom, email), validateur:membres!valide_par(nom), formations(titre)"
      )
      .order("date_validation", { ascending: false })
      .limit(15);

    setMembres(m ?? []);
    setFormations(f ?? []);
    setValidations(v ?? []);
  }

useEffect(() => {
  async function checkAdmin() {

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      window.location.href = "/";
      return;
    }

    const { data: m } = await supabase
      .from("membres")
      .select("role")
      .eq("auth_id", userId)
      .maybeSingle();

    if (!m || m.role !== "admin") {
      window.location.href = "/";
      return;
    }

    loadData();
  }

  checkAdmin();
}, []);

    // 3) Charger les données admin
    await loadData();
  })();
}, []);

const { data: m } = await supabase
  .from("membres")
  .select("*")
  .eq("auth_id", userData.user?.id)
  .maybeSingle();

if (!m || m.role !== "admin") {
  window.location.href = "/";
  return;
});
  }, []);

  async function createFormation() {

    if (!titreFormation) {
      alert("Titre obligatoire");
      return;
    }

    await supabase.from("formations").insert({
      titre: titreFormation,
      duree_heures: dureeFormation,
      niveau: niveauFormation,
      description: descriptionFormation,
      competences: competencesFormation
    });

    setTitreFormation("");
    setDureeFormation(0);
    setNiveauFormation("");
    setDescriptionFormation("");
    setCompetencesFormation("");

    loadData();
  }

  async function validateFormation() {

    if (!selectedMembre || !selectedFormation) {
      alert("Choisir membre et formation");
      return;
    }

    const { data: exist } = await supabase
      .from("validations")
      .select("*")
      .eq("membre_id", selectedMembre)
      .eq("formation_id", selectedFormation);

    if (exist && exist.length > 0) {
      alert("Formation déjà validée pour ce membre");
      return;
    }

    await supabase.from("validations").insert({
      membre_id: selectedMembre,
      formation_id: selectedFormation
    });

    alert("Validation enregistrée");

    loadData();
  }

  const membresFiltres = membres.filter((m) =>
    (m.nom + m.email).toLowerCase().includes(searchMembre.toLowerCase())
  );

  const formationsFiltrees = formations.filter((f) =>
    f.titre.toLowerCase().includes(searchFormation.toLowerCase())
  );

  const nombreMembres = membres.filter((m) => m.role === "membre").length;

  return (
    <main className="card">

      <h1 className="h1">Administration</h1>

      <div className="small">
        Membres inscrits : {nombreMembres} / 300
      </div>

      <hr className="hr"/>

      <h2>Créer une formation</h2>

      <div style={{display:"grid",gap:8,maxWidth:600}}>

        <input
          className="input"
          placeholder="Titre"
          value={titreFormation}
          onChange={(e)=>setTitreFormation(e.target.value)}
        />

        <input
          className="input"
          type="number"
          placeholder="Durée (heures)"
          value={dureeFormation}
          onChange={(e)=>setDureeFormation(Number(e.target.value))}
        />

        <input
          className="input"
          placeholder="Niveau"
          value={niveauFormation}
          onChange={(e)=>setNiveauFormation(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Description"
          value={descriptionFormation}
          onChange={(e)=>setDescriptionFormation(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Compétences"
          value={competencesFormation}
          onChange={(e)=>setCompetencesFormation(e.target.value)}
        />

        <button className="button" onClick={createFormation}>
          Ajouter la formation
        </button>

      </div>

      <hr className="hr"/>

      <h2>Valider une formation</h2>

      <div className="row">

        <input
          className="input"
          placeholder="Rechercher membre"
          value={searchMembre}
          onChange={(e)=>setSearchMembre(e.target.value)}
        />

        <input
          className="input"
          placeholder="Rechercher formation"
          value={searchFormation}
          onChange={(e)=>setSearchFormation(e.target.value)}
        />

      </div>

      <div className="row">

        <select
          className="input"
          value={selectedMembre}
          onChange={(e)=>setSelectedMembre(e.target.value)}
        >

          <option value="">Choisir membre</option>

          {membresFiltres.map((m)=>(
            <option key={m.id} value={m.id}>
              {m.nom} — {m.email}
            </option>
          ))}

        </select>

        <select
          className="input"
          value={selectedFormation}
          onChange={(e)=>setSelectedFormation(e.target.value)}
        >

          <option value="">Choisir formation</option>

          {formationsFiltrees.map((f)=>(
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}

        </select>

        <button className="button" onClick={validateFormation}>
          Valider
        </button>

      </div>

      <hr className="hr"/>

      <h2>Validations récentes</h2>

      {validations.map((v)=>(
        <div key={v.id} className="small">
          {v.membres?.nom} — {v.formations?.titre} (validé par {v.validateur?.nom})
        </div>
      ))}

    </main>
  );
}
