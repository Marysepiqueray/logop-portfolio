"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = { id: string; ordre: number; nom: string; description: string };

function medal(hours: number) {
  if (hours >= 90) return { label: "OR", icon: "🥇", next: 90 };
  if (hours >= 45) return { label: "ARGENT", icon: "🥈", next: 90 };
  if (hours >= 15) return { label: "BRONZE", icon: "🥉", next: 45 };
  return { label: "Aucun", icon: "⬜", next: 15 };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function MePage() {
  const [loading, setLoading] = useState(true);

  const [membre, setMembre] = useState<any>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [activites, setActivites] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);

  // Form déclaration
  const [typeAct, setTypeAct] = useState<"formation_externe" | "conference" | "webinaire">("formation_externe");
  const [titreAct, setTitreAct] = useState("");
  const [organismeAct, setOrganismeAct] = useState("");
  const [dateAct, setDateAct] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [heuresAct, setHeuresAct] = useState<number>(0);
  const [domaineAct, setDomaineAct] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        window.location.href = "/";
        return;
      }

      const { data: m } = await supabase.from("membres").select("*").eq("auth_id", userId).maybeSingle();
      if (!m) {
        alert("Compte non lié à un membre.");
        window.location.href = "/";
        return;
      }
      setMembre(m);

      const { data: d } = await supabase
        .from("domaines")
        .select("id, ordre, nom, description")
        .order("ordre", { ascending: true });
      setDomaines((d ?? []) as any);

      const { data: v } = await supabase
        .from("validations")
        .select("date_validation, formation:formations(titre, duree_heures, niveau, domaine_id, type)")
        .eq("membre_id", m.id)
        .order("date_validation", { ascending: false });
      setValidations(v ?? []);

      const { data: a } = await supabase
        .from("activites")
        .select("id, titre, organisme, date, duree_heures, domaine_id, type, statut, created_at")
        .eq("membre_id", m.id)
        .order("created_at", { ascending: false });
      setActivites(a ?? []);

      const { data: f } = await supabase
        .from("formations")
        .select("id, titre, duree_heures, domaine_id, type")
        .order("titre", { ascending: true });
      setFormations(f ?? []);

      setLoading(false);
    })();
  }, []);

  const totalHeuresInternes = useMemo(
    () => (validations ?? []).reduce((sum, v) => sum + Number(v.formation?.duree_heures ?? 0), 0),
    [validations]
  );

  const totalHeuresDeclarees = useMemo(
    () => (activites ?? []).reduce((sum, a) => sum + Number(a.duree_heures ?? 0), 0),
    [activites]
  );

  const heuresParDomaine = useMemo(() => {
    const map: Record<string, number> = {};

    for (const v of validations ?? []) {
      const dom = v.formation?.domaine_id;
      if (!dom) continue;
      map[dom] = (map[dom] ?? 0) + Number(v.formation?.duree_heures ?? 0);
    }

    for (const a of activites ?? []) {
      const dom = a.domaine_id;
      if (!dom) continue;
      map[dom] = (map[dom] ?? 0) + Number(a.duree_heures ?? 0);
    }

    return map;
  }, [validations, activites]);

  const passeport = useMemo(() => {
    return domaines.map((d) => {
      const h = Number(heuresParDomaine[d.id] ?? 0);
      const m = medal(h);
      const next = m.next;
      const missing = m.label === "OR" ? 0 : Math.max(0, next - h);
      return { domaine: d, heures: h, medal: m, missing };
    });
  }, [domaines, heuresParDomaine]);

  const objectif = useMemo(() => {
    const c = passeport.filter((p) => p.missing > 0);
    if (c.length === 0) return null;
    c.sort((a, b) => a.missing - b.missing);
    return c[0];
  }, [passeport]);

  const recommandations = useMemo(() => {
    if (!objectif) return [];

    const alreadyValidated = new Set((validations ?? []).map((v) => (v.formation?.titre ?? "").toLowerCase()));

    return (formations ?? [])
      .filter((f) => (f.type ?? "formation_interne") === "formation_interne")
      .filter((f) => f.domaine_id === objectif.domaine.id)
      .filter((f) => !alreadyValidated.has((f.titre ?? "").toLowerCase()))
      .slice(0, 3);
  }, [objectif, formations, validations]);

  async function downloadPdf() {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    if (!token) {
      alert("Vous n'êtes pas connecté(e).");
      window.location.href = "/";
      return;
    }

    const res = await fetch("/api/portfolio", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      alert("Impossible de générer le PDF.\n" + txt);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Portfolio-${membre?.nom ?? "membre"}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function addActivite() {
    if (!titreAct.trim()) return alert("Titre obligatoire");
    if (!domaineAct) return alert("Choisis un domaine");
    if (!dateAct) return alert("Choisis une date");

    const { error } = await supabase.from("activites").insert({
      membre_id: membre.id,
      type: typeAct,
      titre: titreAct.trim(),
      organisme: organismeAct.trim() || null,
      date: dateAct,
      duree_heures: Number(heuresAct ?? 0),
      domaine_id: domaineAct,
      statut: "non_validee",
    });

    if (error) return alert(error.message);

    setTitreAct("");
    setOrganismeAct("");
    setHeuresAct(0);

    const { data: a } = await supabase
      .from("activites")
      .select("id, titre, organisme, date, duree_heures, domaine_id, type, statut, created_at")
      .eq("membre_id", membre.id)
      .order("created_at", { ascending: false });

    setActivites(a ?? []);
    alert("Activité ajoutée (non validée) ✅");
  }

  if (loading) return <main className="card">Chargement…</main>;

  const nbInternes = (validations ?? []).filter((v) => (v.formation?.type ?? "formation_interne") === "formation_interne")
    .length;
  const nbDeclarees = activites.length;
  const nbConf = activites.filter((a) => a.type === "conference").length;

  return (
    <main className="card">
      <h1 className="h1">Passeport de compétences Logop’Aide et vous</h1>

      <p className="p">
        Membre : <b>{membre?.nom}</b> — {membre?.email}
      </p>

      <div className="row" style={{ marginTop: 10 }}>
        <span className="badge">
          Formations internes : <b>{nbInternes}</b>
        </span>
        <span className="badge">
          Activités déclarées : <b>{nbDeclarees}</b>
        </span>
        <span className="badge">
          Conférences : <b>{nbConf}</b>
        </span>
        <span className="badge">
          Total heures : <b>{totalHeuresInternes + totalHeuresDeclarees}h</b>
        </span>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="button" onClick={downloadPdf}>
          Télécharger mon portfolio PDF
        </button>
      </div>

      <hr className="hr" />

      <h2 style={{ marginBottom: 10 }}>Objectif prochain niveau</h2>

      {objectif ? (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="small" style={{ fontWeight: 800 }}>
            {objectif.domaine.nom}
          </div>

          <div className="small" style={{ marginTop: 6 }}>
            Vous avez <b>{objectif.heures}h</b> — il vous manque <b>{objectif.missing}h</b> pour atteindre le prochain niveau.
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            <b>Formations proposées :</b>
          </div>

          {recommandations.length === 0 ? (
            <div className="small" style={{ marginTop: 6 }}>
              Aucune proposition pour le moment (pense à attribuer un <b>domaine</b> aux formations internes dans l’admin).
            </div>
          ) : (
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              {recommandations.map((f) => (
                <li key={f.id} className="small">
                  {f.titre} — {Number(f.duree_heures ?? 0)}h
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="p">Bravo 🎉 Tous les domaines sont au niveau OR ou aucun domaine n’est renseigné.</p>
      )}

      <hr className="hr" />

      <h2 style={{ marginBottom: 10 }}>Mes domaines</h2>

      <div className="badge-grid">
        {passeport.map((p) => {
          const pct = clamp((p.heures / p.medal.next) * 100, 0, 100);

          return (
            <div key={p.domaine.id} className="badge-tile">
              <div className="badge-medal">{p.medal.icon}</div>

              <div>
                <div className="badge-tile-title">{p.domaine.nom}</div>

                <div className="badge-tile-meta" style={{ marginBottom: 8 }}>
                  {p.domaine.description}
                </div>

                <div className="badge-tile-meta" style={{ fontWeight: 700 }}>
                  {p.medal.label} — {p.heures}h
                </div>

                <div className="progress">
                  <div style={{ width: `${pct}%` }} />
                </div>

                {p.medal.label !== "OR" ? (
                  <div className="badge-tile-meta" style={{ marginTop: 8 }}>
                    Il vous manque <b>{p.missing}h</b> pour atteindre le prochain niveau.
                  </div>
                ) : (
                  <div className="badge-tile-meta" style={{ marginTop: 8 }}>
                    Niveau maximal atteint.
                  </div>
                )}

                <div className="badge-tile-meta" style={{ marginTop: 6 }}>
                  Seuils : Bronze 15h • Argent 45h • Or 90h
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <hr className="hr" />

      <h2>Déclarer une activité (non validée)</h2>
      <p className="p">
        Les activités déclarées apparaissent dans votre passeport et sont mentionnées comme{" "}
        <b>non validées par Logop’Aide et vous</b>.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
        <div className="row">
          <select className="input" value={typeAct} onChange={(e) => setTypeAct(e.target.value as any)}>
            <option value="formation_externe">Formation externe</option>
            <option value="conference">Conférence</option>
            <option value="webinaire">Webinaire</option>
          </select>

          <input className="input" type="date" value={dateAct} onChange={(e) => setDateAct(e.target.value)} />
        </div>

        <input className="input" placeholder="Titre" value={titreAct} onChange={(e) => setTitreAct(e.target.value)} />
        <input
          className="input"
          placeholder="Organisme (optionnel)"
          value={organismeAct}
          onChange={(e) => setOrganismeAct(e.target.value)}
        />

        <div className="row">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="input"
              type="number"
              min="0"
              step="0.5"
              style={{ maxWidth: 120 }}
              value={heuresAct}
              onChange={(e) => setHeuresAct(Number(e.target.value))}
            />
            <span className="small">heures</span>
          </div>

          <select className="input" value={domaineAct} onChange={(e) => setDomaineAct(e.target.value)}>
            <option value="">Choisir un domaine</option>
            {domaines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ marginTop: -2 }}>
          <button type="button" className="button secondary" onClick={() => setHeuresAct(1)}>
            1h
          </button>
          <button type="button" className="button secondary" onClick={() => setHeuresAct(2)}>
            2h
          </button>
          <button type="button" className="button secondary" onClick={() => setHeuresAct(3)}>
            3h
          </button>
          <button type="button" className="button secondary" onClick={() => setHeuresAct(7)}>
            7h
          </button>
          <button type="button" className="button secondary" onClick={() => setHeuresAct(14)}>
            14h
          </button>
        </div>

        <button className="button" onClick={addActivite}>
          Ajouter (non validée)
        </button>
      </div>

      <hr className="hr" />
<hr className="hr"/>

<h2>Profil dans l’annuaire</h2>

<p className="p">
Vous pouvez choisir d’apparaître dans l’annuaire des logopèdes.
</p>

<div style={{display:"grid",gap:10,maxWidth:600}}>

<label className="small">Ville</label>

<input
className="input"
value={ville}
onChange={(e)=>setVille(e.target.value)}
placeholder="Ex : Bruxelles"
/>

<label className="small">Présentation</label>

<textarea
className="input"
value={presentation}
onChange={(e)=>setPresentation(e.target.value)}
placeholder="Décrivez brièvement votre pratique."
/>

<label className="small">

<input
type="checkbox"
checked={annuaireVisible}
onChange={(e)=>setAnnuaireVisible(e.target.checked)}
/>

{" "}Apparaître dans l’annuaire

</label>

<button
className="button"
onClick={saveAnnuaire}
>
Enregistrer
</button>

</div>
      
      <h2>Mes activités déclarées</h2>
      {activites.length === 0 ? (
        <p className="p">Aucune activité déclarée.</p>
      ) : (
        activites.map((a) => {
          const dom = domaines.find((d) => d.id === a.domaine_id)?.nom ?? "Domaine non défini";
          const labelType = a.type === "conference" ? "Conférence" : a.type === "webinaire" ? "Webinaire" : "Formation externe";

          return (
            <div key={a.id} className="small" style={{ marginBottom: 8 }}>
              <b>{a.titre}</b> — {labelType} — {Number(a.duree_heures ?? 0)}h — {dom} —{" "}
              <i>non validée par Logop’Aide et vous</i>
            </div>
          );
        })
      )}
    </main>
  );
}
