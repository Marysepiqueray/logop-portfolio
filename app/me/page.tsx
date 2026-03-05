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

  // Validations internes (formations créées/validées via admin)
  const [validations, setValidations] = useState<any[]>([]);

  // Activités déclarées par le membre (externes / conf / webinaire)
  const [activites, setActivites] = useState<any[]>([]);

  // Formulaire déclaration
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

      const { data: m } = await supabase
        .from("membres")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle();

      if (!m) {
        alert("Compte non lié à un membre.");
        window.location.href = "/";
        return;
      }

      setMembre(m);

      // Domaines
      const { data: d } = await supabase
        .from("domaines")
        .select("id, ordre, nom, description")
        .order("ordre", { ascending: true });

      setDomaines((d ?? []) as any);

      // Validations (formations internes validées)
      const { data: v } = await supabase
        .from("validations")
        .select("date_validation, formation:formations(titre, duree_heures, niveau, domaine_id, type)")
        .eq("membre_id", m.id)
        .order("date_validation", { ascending: false });

      setValidations(v ?? []);

      // Activités déclarées
      const { data: a } = await supabase
        .from("activites")
        .select("id, titre, organisme, date, duree_heures, domaine_id, type, statut")
        .eq("membre_id", m.id)
        .order("created_at", { ascending: false });

      setActivites(a ?? []);

      setLoading(false);
    })();
  }, []);

  const totalHeuresInternes = useMemo(() => {
    return (validations ?? []).reduce((sum, v) => sum + Number(v.formation?.duree_heures ?? 0), 0);
  }, [validations]);

  const totalHeuresDeclarees = useMemo(() => {
    return (activites ?? []).reduce((sum, a) => sum + Number(a.duree_heures ?? 0), 0);
  }, [activites]);

  // Heures par domaine (internes + déclarées)
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
      .select("id, titre, organisme, date, duree_heures, domaine_id, type, statut")
      .eq("membre_id", membre.id)
      .order("created_at", { ascending: false });

    setActivites(a ?? []);
    alert("Activité ajoutée (non validée) ✅");
  }

  if (loading) return <main className="card">Chargement…</main>;

  const nbInternes = (validations ?? []).filter((v) => (v.formation?.type ?? "formation_interne") === "formation_interne")
    .length;
  const nbDeclarees = (activites ?? []).length;
  const nbConf = (activites ?? []).filter((a) => a.type === "conference").length;

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

      <h2 style={{ marginBottom: 10 }}>Mes domaines</h2>

      <div className="badge-grid">
        {domaines.map((d) => {
          const h = Number(heuresParDomaine[d.id] ?? 0);
          const m = medal(h);
          const next = m.next;
          const pct = clamp(next === 0 ? 0 : (h / next) * 100, 0, 100);
          const missing = Math.max(0, next - h);

          let message = "";
          if (m.label === "OR") message = "Niveau maximal atteint";
          else message = `Il vous manque ${missing}h pour atteindre le prochain niveau`;

          return (
            <div key={d.id} className="badge-tile">
              <div className="badge-medal">{m.icon}</div>

              <div className="badge-tile-title">{d.nom}</div>

              <div className="badge-tile-meta" style={{ marginBottom: 10 }}>
                {d.description}
              </div>

              <div className="badge-tile-meta" style={{ fontWeight: 700 }}>
                {m.label} — {h}h
              </div>

              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <div style={{ height: "100%", width: `${pct}%`, background: "#111827" }} />
                </div>
                <div className="badge-tile-meta" style={{ marginTop: 8 }}>
                  {message}
                </div>
                {m.label !== "OR" && (
                  <div className="badge-tile-meta" style={{ marginTop: 4 }}>
                    Seuils : Bronze 15h • Argent 45h • Or 90h
                  </div>
                )}
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

<div className="row" style={{ marginTop: 6 }}>

  <button type="button" className="button secondary" onClick={() => setHeuresAct(1)}>1h</button>

  <button type="button" className="button secondary" onClick={() => setHeuresAct(2)}>2h</button>

  <button type="button" className="button secondary" onClick={() => setHeuresAct(3)}>3h</button>

  <button type="button" className="button secondary" onClick={() => setHeuresAct(7)}>7h</button>

  <button type="button" className="button secondary" onClick={() => setHeuresAct(14)}>14h</button>

</div>

        <div className="row">
          <input
            className="input"
            type="number"
            placeholder="Durée (heures)"
            value={heuresAct}
            onChange={(e) => setHeuresAct(Number(e.target.value))}
          />

          <select className="input" value={domaineAct} onChange={(e) => setDomaineAct(e.target.value)}>
            <option value="">Choisir un domaine</option>
            {domaines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>
        </div>

        <button className="button" onClick={addActivite}>
          Ajouter (non validée)
        </button>
      </div>

      <hr className="hr" />

      <h2>Mes activités déclarées</h2>
      {activites.length === 0 ? (
        <p className="p">Aucune activité déclarée.</p>
      ) : (
        activites.map((a) => {
          const dom = domaines.find((d) => d.id === a.domaine_id)?.nom ?? "Domaine non défini";
          const labelType =
            a.type === "conference" ? "Conférence" : a.type === "webinaire" ? "Webinaire" : "Formation externe";

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
