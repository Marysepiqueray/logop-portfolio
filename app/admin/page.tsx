"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = {
  id: string;
  ordre: number;
  nom: string;
  description: string;
};

const SEUIL_BRONZE = 15;
const SEUIL_ARGENT = 45;
const SEUIL_OR = 90;

function tier(hours: number) {
  if (hours >= SEUIL_OR) return "OR";
  if (hours >= SEUIL_ARGENT) return "ARGENT";
  if (hours >= SEUIL_BRONZE) return "BRONZE";
  return "AUCUN";
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  const [membres, setMembres] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validationsRecentes, setValidationsRecentes] = useState<any[]>([]);
  const [reseau, setReseau] = useState<any>(null);

  const [searchMembre, setSearchMembre] = useState("");
  const [searchFormation, setSearchFormation] = useState("");
  const [selectedMembre, setSelectedMembre] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("");

  const [titreFormation, setTitreFormation] = useState("");
  const [dureeFormation, setDureeFormation] = useState<number>(14);
  const [niveauFormation, setNiveauFormation] = useState("");
  const [descriptionFormation, setDescriptionFormation] = useState("");
  const [competencesFormation, setCompetencesFormation] = useState("");
  const [typeFormation, setTypeFormation] = useState<"formation_interne" | "conference_interne">("formation_interne");
  const [domaineId, setDomaineId] = useState("");

  async function loadBaseData() {
    const { data: m, error: me } = await supabase.from("membres").select("*");
    if (me) throw me;

    const { data: d, error: de } = await supabase
      .from("domaines")
      .select("id, ordre, nom, description")
      .order("ordre", { ascending: true });
    if (de) throw de;

    const { data: f, error: fe } = await supabase
      .from("formations")
      .select("id, titre, duree_heures, niveau, domaine_id, type, created_at")
      .order("created_at", { ascending: false });
    if (fe) throw fe;

    const { data: v, error: ve } = await supabase
      .from("validations")
      .select("id, date_validation, membres!membre_id(nom,email), formations(titre)")
      .order("date_validation", { ascending: false })
      .limit(20);
    if (ve) throw ve;

    setMembres(m ?? []);
    setDomaines((d ?? []) as any);
    setFormations(f ?? []);
    setValidationsRecentes(v ?? []);
  }

  async function buildReseauStats(allMembres: any[], allDomaines: Domaine[]) {
    const membresIds = (allMembres ?? [])
      .filter((m) => m.role === "membre")
      .map((m) => m.id);

    const { data: v, error: ve } = await supabase
      .from("validations")
      .select("membre_id, formation:formations(domaine_id, duree_heures)")
      .in("membre_id", membresIds);
    if (ve) throw ve;

    const { data: a, error: ae } = await supabase
      .from("activites")
      .select("membre_id, domaine_id, duree_heures, type")
      .in("membre_id", membresIds);
    if (ae) throw ae;

    const heures: Record<string, Record<string, number>> = {};
    for (const mid of membresIds) heures[mid] = {};

    for (const row of (v ?? []) as any[]) {
      const mid = row.membre_id as string;
      const formation = row.formation as any;
      const dom = formation?.domaine_id as string | undefined;
      if (!mid || !dom) continue;

      const h = Number(formation?.duree_heures ?? 0);
      heures[mid][dom] = (heures[mid][dom] ?? 0) + h;
    }

    let totalExternes = 0;
    let totalConferences = 0;
    let totalWebinaires = 0;

    for (const row of (a ?? []) as any[]) {
      const mid = row.membre_id as string;
      const dom = row.domaine_id as string | undefined;
      if (!mid || !dom) continue;

      const h = Number(row.duree_heures ?? 0);
      heures[mid][dom] = (heures[mid][dom] ?? 0) + h;

      if (row.type === "formation_externe") totalExternes += h;
      if (row.type === "conference") totalConferences += h;
      if (row.type === "webinaire") totalWebinaires += h;
    }

    const totalInternes = (v ?? []).reduce((sum: number, row: any) => {
      const formation = row.formation as any;
      return sum + Number(formation?.duree_heures ?? 0);
    }, 0);

    const parDomaine = allDomaines.map((d) => {
      let nbOr = 0;
      let nbArgent = 0;
      let nbBronze = 0;
      let nbAucun = 0;

      for (const mid of membresIds) {
        const h = Number(heures[mid]?.[d.id] ?? 0);
        const t = tier(h);

        if (t === "OR") nbOr++;
        else if (t === "ARGENT") nbArgent++;
        else if (t === "BRONZE") nbBronze++;
        else nbAucun++;
      }

      return { domaine: d, nbOr, nbArgent, nbBronze, nbAucun };
    });

    return {
      nbMembres: membresIds.length,
      totalInternes,
      totalExternes,
      totalConferences,
      totalWebinaires,
      parDomaine,
    };
  }

  async function createFormation() {
    if (!titreFormation.trim()) return alert("Titre obligatoire");
    if (!domaineId) return alert("Choisir un domaine");
    if (!dureeFormation || dureeFormation < 1) return alert("Durée invalide");

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

    alert("Formation ajoutée ✅");

    setTitreFormation("");
    setDureeFormation(14);
    setNiveauFormation("");
    setDescriptionFormation("");
    setCompetencesFormation("");
    setTypeFormation("formation_interne");
    setDomaineId("");

    await loadBaseData();
  }

  async function validateFormation() {
    if (!selectedMembre || !selectedFormation) return alert("Choisir membre et formation");

    const { data: exist, error: exErr } = await supabase
      .from("validations")
      .select("id")
      .eq("membre_id", selectedMembre)
      .eq("formation_id", selectedFormation);

    if (exErr) return alert(exErr.message);
    if (exist && exist.length > 0) return alert("Déjà validée ✅");

    const { error } = await supabase.from("validations").insert({
      membre_id: selectedMembre,
      formation_id: selectedFormation,
    });

    if (error) return alert(error.message);

    alert("Validation enregistrée ✅");
    await loadBaseData();
  }

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        window.location.href = "/";
        return;
      }

      const { data: row } = await supabase
        .from("membres")
        .select("role")
        .eq("auth_id", userId)
        .maybeSingle();

      if (!row || row.role !== "admin") {
        window.location.href = "/";
        return;
      }

      try {
        await loadBaseData();

        const { data: m } = await supabase.from("membres").select("*");
        const { data: d } = await supabase
          .from("domaines")
          .select("id, ordre, nom, description")
          .order("ordre", { ascending: true });

        const stats = await buildReseauStats(m ?? [], (d ?? []) as any);
        setReseau(stats);
      } catch (e: any) {
        alert(e.message ?? "Erreur chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const membresFiltres = useMemo(() => {
    return (membres ?? [])
      .filter((m) => m.role === "membre")
      .filter((m) => (m.nom + " " + m.email).toLowerCase().includes(searchMembre.toLowerCase()));
  }, [membres, searchMembre]);

  const formationsFiltrees = useMemo(() => {
    return (formations ?? []).filter((f) => (f.titre ?? "").toLowerCase().includes(searchFormation.toLowerCase()));
  }, [formations, searchFormation]);

  if (loading) return <main className="card">Chargement…</main>;

  return (
    <main className="card">
      <h1 className="h1">Administration</h1>

      <hr className="hr" />

      <h2>Tableau de bord du réseau</h2>

      {!reseau ? (
        <p className="p">Statistiques indisponibles.</p>
      ) : (
        <>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="badge">
              Membres : <b>{reseau.nbMembres}</b> / 300
            </span>

            <span className="badge">
              Internes : <b>{Math.round(reseau.totalInternes)}h</b>
            </span>

            <span className="badge">
              Externes : <b>{Math.round(reseau.totalExternes)}h</b>
            </span>

            <span className="badge">
              Conférences : <b>{Math.round(reseau.totalConferences)}h</b>
            </span>

            <span className="badge">
              Webinaires : <b>{Math.round(reseau.totalWebinaires)}h</b>
            </span>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="small" style={{ fontWeight: 700, marginBottom: 8 }}>
              Total heures réseau :{" "}
              {Math.round(
                (reseau?.totalInternes ?? 0) +
                  (reseau?.totalExternes ?? 0) +
                  (reseau?.totalConferences ?? 0) +
                  (reseau?.totalWebinaires ?? 0)
              )}
              h
            </div>

         <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
  Domaines les moins formés
</div>

{reseau?.parDomaine
  ?.slice()
  .sort((a: any, b: any) => a.nbOr - b.nbOr)
  .slice(0, 3)
  .map((x: any) => (
    <div key={x.domaine.id} style={{ marginBottom: 10 }}>
      <div className="small" style={{ marginBottom: 2 }}>
        {x.domaine.nom} — 🥇 {x.nbOr} • 🥈 {x.nbArgent} • 🥉 {x.nbBronze}
      </div>

      <div className="small" style={{ fontStyle: "italic" }}>
        Formation recommandée à organiser : renforcer ce domaine en priorité
      </div>
    </div>
  ))}

      <hr className="hr" />

      <h2>Créer une formation interne</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
        <input
          className="input"
          placeholder="Titre"
          value={titreFormation}
          onChange={(e) => setTitreFormation(e.target.value)}
        />

        <div className="row">
          <select className="input" value={typeFormation} onChange={(e) => setTypeFormation(e.target.value as any)}>
            <option value="formation_interne">Formation interne</option>
            <option value="conference_interne">Conférence interne</option>
          </select>

          <input
            className="input"
            type="number"
            min="1"
            max="200"
            step="1"
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

        <input
          className="input"
          placeholder="Niveau (optionnel)"
          value={niveauFormation}
          onChange={(e) => setNiveauFormation(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Description (optionnel)"
          value={descriptionFormation}
          onChange={(e) => setDescriptionFormation(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Compétences (optionnel)"
          value={competencesFormation}
          onChange={(e) => setCompetencesFormation(e.target.value)}
        />

        <button className="button" onClick={createFormation}>
          Ajouter la formation
        </button>
      </div>

      <hr className="hr" />

      <h2>Valider une formation pour un membre</h2>

      <div className="row">
        <input
          className="input"
          placeholder="Rechercher membre"
          value={searchMembre}
          onChange={(e) => setSearchMembre(e.target.value)}
        />

        <input
          className="input"
          placeholder="Rechercher formation"
          value={searchFormation}
          onChange={(e) => setSearchFormation(e.target.value)}
        />
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

      {validationsRecentes.length === 0 ? (
        <p className="p">Aucune validation récente.</p>
      ) : (
        validationsRecentes.map((v) => (
          <div key={v.id} className="small" style={{ marginBottom: 6 }}>
            {v.membres?.nom} — {v.formations?.titre}
          </div>
        ))
      )}
    </main>
  );
}
