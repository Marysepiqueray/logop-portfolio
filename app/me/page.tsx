"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = {
  id: string;
  ordre: number;
  nom: string;
  description: string;
};

function medal(hours: number) {
  if (hours >= 90) return { label: "OR", icon: "🥇" };
  if (hours >= 45) return { label: "ARGENT", icon: "🥈" };
  if (hours >= 15) return { label: "BRONZE", icon: "🥉" };
  return { label: "AUCUN", icon: "⬜" };
}

export default function MePage() {
  const [loading, setLoading] = useState(true);

  const [membre, setMembre] = useState<any>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [activites, setActivites] = useState<any[]>([]);

  // annuaire
  const [ville, setVille] = useState("");
  const [presentation, setPresentation] = useState("");
  const [annuaireVisible, setAnnuaireVisible] = useState(false);

  // ajout activité
  const [typeActivite, setTypeActivite] = useState("formation_externe");
  const [titreActivite, setTitreActivite] = useState("");
  const [organismeActivite, setOrganismeActivite] = useState("");
  const [dureeActivite, setDureeActivite] = useState<number>(2);
  const [domaineActivite, setDomaineActivite] = useState("");
  const [dateActivite, setDateActivite] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        window.location.href = "/";
        return;
      }

      const { data: m } = await supabase
        .from("membres")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle();

      if (!m) {
        alert("Compte non lié");
        window.location.href = "/";
        return;
      }

      const { data: d } = await supabase
        .from("domaines")
        .select("id, ordre, nom, description")
        .order("ordre", { ascending: true });

      const { data: v } = await supabase
        .from("validations")
        .select("date_validation, formation:formations(titre, domaine_id, duree_heures, niveau)")
        .eq("membre_id", m.id)
        .order("date_validation", { ascending: false });
const [activites, setActivites] = useState<any[]>([]);
      const { data: a } = await supabase
        .from("activites")
        .select("*")
        .eq("membre_id", m.id)
        .order("created_at", { ascending: false });

      setMembre(m);
      setDomaines((d ?? []) as any);
      setValidations(v ?? []);
      setActivites(a ?? []);

      setVille(m.ville ?? "");
      setPresentation(m.presentation ?? "");
      setAnnuaireVisible(m.annuaire_visible ?? false);

      setLoading(false);
    })();
  }, []);

  const passeport = useMemo(() => {
    const heures: Record<string, number> = {};

    for (const row of validations as any[]) {
      const formation = row.formation as any;
      const dom = formation?.domaine_id as string | undefined;
      if (!dom) continue;

      const h = Number(formation?.duree_heures ?? 0);
      heures[dom] = (heures[dom] ?? 0) + h;
    }

    for (const row of activites as any[]) {
      const dom = row.domaine_id as string | undefined;
      if (!dom) continue;

      const h = Number(row.duree_heures ?? 0);
      heures[dom] = (heures[dom] ?? 0) + h;
    }

    return domaines.map((d) => {
      const h = Number(heures[d.id] ?? 0);
      const med = medal(h);

      return {
        domaine: d,
        heures: h,
        medal: med,
      };
    });
  }, [domaines, validations, activites]);

  async function saveAnnuaire() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      alert("Utilisateur non connecté");
      return;
    }

    const { error } = await supabase
      .from("membres")
      .update({
        ville,
        presentation,
        annuaire_visible: annuaireVisible,
      })
      .eq("auth_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profil annuaire enregistré");
  }

  async function addActivite() {
    if (!membre?.id) return alert("Membre introuvable");
    if (!titreActivite.trim()) return alert("Titre obligatoire");
    if (!domaineActivite) return alert("Choisir un domaine");
if (dateActivite < "2016-01-01") {
  return alert("La date doit être au minimum le 01/01/2016");
}
    const { error } = await supabase.from("activites").insert({
      membre_id: membre.id,
      titre: titreActivite.trim(),
      organisme: organismeActivite.trim() || null,
      date: dateActivite,
      duree_heures: Number(dureeActivite),
      domaine_id: domaineActivite,
      type: typeActivite,
      statut: "non_validee",
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: a } = await supabase
      .from("activites")
      .select("*")
      .eq("membre_id", membre.id)
      .order("created_at", { ascending: false });

    setActivites(a ?? []);

    setTitreActivite("");
    setOrganismeActivite("");
    setDureeActivite(2);
    setDomaineActivite("");
    setTypeActivite("formation_externe");
    setDateActivite(new Date().toISOString().slice(0, 10));

    alert("Activité ajoutée");
  }

  async function generatePDF() {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const res = await fetch("/api/portfolio", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      alert("Erreur génération PDF\n" + txt);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.pdf";
    a.click();
  }

  if (loading) {
    return <main className="card">Chargement…</main>;
  }

  return (
    <main className="card">
      <h1 className="h1">Mon portfolio</h1>

      <div className="row">
        <button className="button" onClick={generatePDF}>
          Télécharger le portfolio PDF
        </button>
      </div>

      <hr className="hr" />

      <h2>Mes domaines</h2>

      <div className="badge-grid">
        {passeport.map((p: any) => {
          const pct = Math.min(100, (p.heures / 90) * 100);

          return (
            <div key={p.domaine.id} className="badge-tile">
              <div className="badge-medal">{p.medal.icon}</div>

              <div>
                <div className="badge-tile-title">{p.domaine.nom}</div>

                <div className="badge-tile-meta">{p.domaine.description}</div>

                <div className="badge-tile-meta">
                  {p.medal.label} — {p.heures}h
                </div>

                <div className="progress">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <hr className="hr" />

      <h2>Ajouter une activité</h2>

      <p className="p">
        Vous pouvez ajouter vous-même une formation externe, une conférence ou un webinaire.
        Ces activités seront marquées comme <b>non validées par Logop’Aide et vous</b>.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <select
          className="input"
          value={typeActivite}
          onChange={(e) => setTypeActivite(e.target.value)}
        >
          <option value="formation_externe">Formation externe</option>
          <option value="conference">Conférence</option>
          <option value="webinaire">Webinaire</option>
        </select>

        <input
          className="input"
          value={titreActivite}
          onChange={(e) => setTitreActivite(e.target.value)}
          placeholder="Titre de l’activité"
        />

        <input
          className="input"
          value={organismeActivite}
          onChange={(e) => setOrganismeActivite(e.target.value)}
          placeholder="Organisme (optionnel)"
        />

        <div className="row">
          <input
            className="input"
            type="number"
            min="1"
            max="200"
            step="1"
            value={dureeActivite}
            onChange={(e) => setDureeActivite(Number(e.target.value))}
            placeholder="Durée (heures)"
          />

   <input
  className="input"
  type="date"
  min="2016-01-01"
  value={dateActivite}
  onChange={(e) => setDateActivite(e.target.value)}
/>
        </div>

        <select
          className="input"
          value={domaineActivite}
          onChange={(e) => setDomaineActivite(e.target.value)}
        >
          <option value="">Choisir un domaine</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>

        <button className="button" onClick={addActivite}>
          Ajouter l’activité
        </button>
      </div>

      <hr className="hr" />

      <h2>Mes activités ajoutées</h2>

      {activites.length === 0 ? (
        <p className="p">Aucune activité ajoutée pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {activites.map((a: any) => {
            const d = domaines.find((x) => x.id === a.domaine_id);

            return (
              <div key={a.id} className="small">
                <b>{a.titre}</b> — {a.duree_heures}h — {d?.nom ?? "Domaine non défini"} —{" "}
                <i>non validée par Logop’Aide et vous</i>
              </div>
            );
          })}
        </div>
      )}

      <hr className="hr" />

      <h2>Profil dans l’annuaire</h2>

      <p className="p">
        Choisissez si vous souhaitez apparaître dans l’annuaire des logopèdes.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 600 }}>
        <label className="small">Ville</label>

        <input
          className="input"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="Ex : Bruxelles"
        />

        <label className="small">Présentation</label>

        <textarea
          className="input"
          value={presentation}
          onChange={(e) => setPresentation(e.target.value)}
          placeholder="Décrivez brièvement votre pratique."
        />

        <label className="small">
          <input
            type="checkbox"
            checked={annuaireVisible}
            onChange={(e) => setAnnuaireVisible(e.target.checked)}
          />{" "}
          Apparaître dans l’annuaire
        </label>

        <button className="button" onClick={saveAnnuaire}>
          Enregistrer
        </button>
      </div>
    </main>
  );
}
