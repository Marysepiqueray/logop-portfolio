"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = { id: string; ordre: number; nom: string; description: string };

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  const [membres, setMembres] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validations, setValidations] = useState<any[]>([]);

  // Recherche / sélection validation
  const [searchMembre, setSearchMembre] = useState("");
  const [searchFormation, setSearchFormation] = useState("");
  const [selectedMembre, setSelectedMembre] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("");

  // Création formation
  const [titreFormation, setTitreFormation] = useState("");
  const [dureeFormation, setDureeFormation] = useState<number>(14);
  const [niveauFormation, setNiveauFormation] = useState("");
  const [descriptionFormation, setDescriptionFormation] = useState("");
  const [competencesFormation, setCompetencesFormation] = useState("");

  const [typeFormation, setTypeFormation] = useState<"formation_interne" | "conference_interne">("formation_interne");
  const [domaineId, setDomaineId] = useState<string>("");

  async function loadData() {
    const { data: m, error: me } = await supabase.from("membres").select("*");
    const { data: d, error: de } = await supabase
      .from("domaines")
      .select("id, ordre, nom, description")
      .order("ordre", { ascending: true });

    const { data: f, error: fe } = await supabase
      .from("formations")
      .select("id, titre, duree_heures, niveau, domaine_id, type, created_at")
      .order("created_at", { ascending: false });

    const { data: v, error: ve } = await supabase
      .from("validations")
      .select(
        "id, date_validation, membres!membre_id(nom,email), validateur:membres!valide_par(nom), formations(titre)"
      )
      .order("date_validation", { ascending: false })
      .limit(20);

    if (me) alert(me.message);
    if (de) alert(de.message);
    if (fe) alert(fe.message);
    if (ve) alert(ve.message);

    setMembres(m ?? []);
    setDomaines((d ?? []) as any);
    setFormations(f ?? []);
    setValidations(v ?? []);
  }

  // ✅ Bloque /admin pour les non-admin
  useEffect(() => {
    (async () => {
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
      setLoading(false);
    })();
  }, []);

  async function createFormation() {
    if (!titreFormation.trim()) return alert("Titre obligatoire");
    if (!domaineId) return alert("Choisis un domaine");
    if (!dureeFormation || dureeFormation < 0) return alert("Durée invalide");

    const { error } = await supabase.from("formations").insert({
      titre: titreFormation.trim(),
      duree_heures: Number(dureeFormation),
      niveau: niveauFormation || null,
      description: descriptionFormation || null,
      competences: competencesFormation || null,
      domaine_id: domaineId,
      type: typeFormation,
    });

    if (error) return alert(error.message);

    setTitreFormation("");
    setDureeFormation(14);
    setNiveauFormation("");
    setDescriptionFormation("");
    setCompetencesFormation("");
    setTypeFormation("formation_interne");
    setDomaineId("");

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

    if (exErr) return alert(exErr.message);
    if (exist && exist.length > 0) return alert("Déjà validée ✅");

    // récupérer l'ID admin (membres.id) pour valide_par
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const { data: adminRow, error: arErr } = await supabase
      .from("membres")
      .select("id")
      .eq("auth_id", userId)
      .maybeSingle();

    if (arErr) return alert(arErr.message);

    const { error } = await supabase.from("validations").insert({
      membre_id: selectedMembre,
      formation_id: selectedFormation,
      valide_par: adminRow?.id ?? null,
    });

    if (error) return alert(error.message);

    alert("Validation enregistrée ✅");
    await loadData();
  }

  const membresFiltres = useMemo(() => {
    return (membres ?? [])
      .filter((m) => m.role === "membre")
      .filter((m) => (m.nom + " " + m.email).toLowerCase().includes(searchMembre.toLowerCase()));
  }, [membres, searchMembre]);

  const formationsFiltrees = useMemo(() => {
    return (formations ?? []).filter((f) => (f.titre ?? "").toLowerCase().includes(searchFormation.toLowerCase()));
  }, [formations, searchFormation]);

  const nombreMembres = (membres ?? []).filter((m) => m.role === "membre").length;

  if (loading) return <main className="card">Chargement…</main>;

  return (
    <main className="card">
      <h1 className="h1">Administration</h1>

      <div className="small">Membres inscrits : {nombreMembres} / 300</div>

      <hr className="hr" />

      <h2>Créer une formation interne</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
        <input className="input" placeholder="Titre" value={titreFormation} onChange={(e) => setTitreFormation(e.target.value)} />

        <div className="row">
          <select className="input" value={typeFormation} onChange={(e) => setTypeFormation(e.target.value as any)}>
            <option value="formation_interne">Formation interne</option>
            <option value="conference_interne">Conférence interne</option>
          </select>

          <input
            className="input"
            type="number"
            placeholder="Durée (heures)"
            value={dureeFormation}
            onChange={(e) => setDureeFormation(Number(e.target.value))}
          />
        </div>

        <select className="input" value={domaineId} onChange={(e) => setDomaineId(e.target.value)}>
          <option value="">Choisir un domaine</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>

        <input className="input" placeholder="Niveau (optionnel)" value={niveauFormation} onChange={(e) => setNiveauFormation(e.target.value)} />

        <textarea className="input" placeholder="Description (optionnel)" value={descriptionFormation} onChange={(e) => setDescriptionFormation(e.target.value)} />

        <textarea className="input" placeholder="Compétences (optionnel)" value={competencesFormation} onChange={(e) => setCompetencesFormation(e.target.value)} />

        <button className="button" onClick={createFormation}>
          Ajouter
        </button>
      </div>

      <hr className="hr" />

      <h2>Valider une formation pour un membre</h2>

      <div className="row">
        <input className="input" placeholder="Rechercher membre" value={searchMembre} onChange={(e) => setSearchMembre(e.target.value)} />
        <input className="input" placeholder="Rechercher formation" value={searchFormation} onChange={(e) => setSearchFormation(e.target.value)} />
      </div>

      <div className="row" style={{ marginTop: 8 }}>
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
