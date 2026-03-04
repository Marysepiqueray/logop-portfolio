"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Membre = { id: string; nom: string; email: string; role: "admin" | "membre" };

type ValidationRow = {
  date_validation: string;
  formation: {
    titre: string;
    competences: string | null;
    duree_heures: number | null;
    niveau: string | null;
  };
};

function getBadgeIcon(titre: string = "", competences: string = "") {
  const text = `${titre} ${competences}`.toLowerCase();

  if (text.includes("neuro")) return "🧠";
  if (text.includes("langage")) return "🗣️";
  if (text.includes("articulation")) return "👄";
  if (text.includes("oro")) return "👄";
  if (text.includes("biling")) return "🌍";
  if (text.includes("voix")) return "🎤";
  if (text.includes("enfant") || text.includes("pédi") || text.includes("pedi")) return "👶";

  return "🏅";
}

export default function MePage() {
  const [loading, setLoading] = useState(true);
  const [membre, setMembre] = useState<Membre | null>(null);
  const [validations, setValidations] = useState<ValidationRow[]>([]);

  useEffect(() => {
    (async () => {
      // 1) Session
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        window.location.href = "/";
        return;
      }

      // 2) Membre lié
      const { data: m, error: mErr } = await supabase
        .from("membres")
        .select("id, nom, email, role")
        .eq("auth_id", userId)
        .maybeSingle();

      if (mErr || !m) {
        alert("Accès non autorisé : votre compte n’est pas lié à un membre.");
        await supabase.auth.signOut();
        window.location.href = "/";
        return;
      }

      setMembre(m);

      // 3) Validations du membre
      const { data: v, error: vErr } = await supabase
        .from("validations")
        .select("date_validation, formation:formations(titre, competences, duree_heures, niveau)")
        .eq("membre_id", m.id)
        .order("date_validation", { ascending: false });

      if (vErr) {
        alert(vErr.message);
        setValidations([]);
      } else {
        setValidations((v ?? []) as any);
      }

      setLoading(false);
    })();
  }, []);

  const totalHeures = useMemo(() => {
    return validations.reduce((sum, v) => sum + Number(v.formation?.duree_heures ?? 0), 0);
  }, [validations]);

  async function downloadPdf() {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

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

  if (loading) return <main className="card">Chargement…</main>;

  return (
    <main className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>
          Mon portfolio
        </h1>
        <a className="button secondary" href="/">
          Retour accueil
        </a>
      </div>

      <p className="p">
        Membre : <b>{membre?.nom}</b> — {membre?.email}
      </p>

      <div className="row" style={{ margin: "12px 0" }}>
        <span className="badge">
          <b>Formations validées :</b> {validations.length}
        </span>
        <span className="badge">
          <b>Total heures :</b> {totalHeures}
        </span>
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <button onClick={downloadPdf} className="button">
          Télécharger mon portfolio PDF
        </button>
      </div>

      <hr className="hr" />

      <h2 style={{ margin: "0 0 10px" }}>Mes badges</h2>

      {validations.length === 0 ? (
        <p className="p">Aucune formation validée pour le moment.</p>
      ) : (
        <div className="badge-grid">
          {validations.map((v, idx) => (
            <div key={idx} className="badge-tile">
              <div className="badge-medal">
                {getBadgeIcon(v.formation?.titre ?? "", v.formation?.competences ?? "")}
              </div>

              <div>
                <div className="badge-tile-title">{v.formation?.titre ?? "Formation"}</div>
                <div className="badge-tile-meta">
                  Formation certifiée
                  <br />
                  Validée le {v.date_validation}
                  <br />
                  Durée : {Number(v.formation?.duree_heures ?? 0)}h
                  {v.formation?.niveau ? <> • Niveau : {v.formation.niveau}</> : null}
                  {v.formation?.competences ? (
                    <>
                      <br />
                      Compétences : {v.formation.competences}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
