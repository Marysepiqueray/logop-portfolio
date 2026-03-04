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

  async function loadData() {

    const { data: m } = await supabase.from("membres").select("*");
    const { data: f } = await supabase.from("formations").select("*");

    const { data: v } = await supabase
      .from("validations")
      .select("*, membres(nom), formations(titre)")
      .order("date_validation", { ascending: false })
      .limit(10);

    setMembres(m ?? []);
    setFormations(f ?? []);
    setValidations(v ?? []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createFormation() {

    if (!titreFormation) {
      alert("Titre obligatoire");
      return;
    }

    await supabase.from("formations").insert({
      titre: titreFormation,
      duree_heures: dureeFormation
    });

    setTitreFormation("");
    setDureeFormation(0);

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

  return (
    <main className="card">

      <h1 className="h1">Administration</h1>

      <hr className="hr"/>

      <h2>Créer une formation</h2>

      <div className="row">
        <input
          className="input"
          placeholder="Titre formation"
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

        <button className="button" onClick={createFormation}>
          Ajouter
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
          {v.membres?.nom} — {v.formations?.titre}
        </div>
      ))}

    </main>
  );
}
