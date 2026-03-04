"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function getBadgeIcon(titre: string = "", competences: string = "") {

  const text = (titre + " " + competences).toLowerCase();

  if (text.includes("neuro")) return "🧠";
  if (text.includes("langage")) return "🗣️";
  if (text.includes("articulation")) return "👄";
  if (text.includes("oro")) return "👄";
  if (text.includes("biling")) return "🌍";
  if (text.includes("voix")) return "🎤";
  if (text.includes("enfant") || text.includes("pédi")) return "👶";

  return "🏅";
}

export default function MePage() {

  const [membre, setMembre] = useState<any>(null);
  const [validations, setValidations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function load() {

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
        return;
      }

      setMembre(m);

      const { data: v } = await supabase
        .from("validations")
        .select("date_validation, formation:formations(titre, competences, duree_heures, niveau)")
        .eq("membre_id", m.id)
        .order("date_validation", { ascending: false });

      setValidations(v ?? []);

      setLoading(false);
    }

    load();

  }, []);

  async function downloadPdf() {

    const { data: session } = await supabase.auth.getSession();

    const token = session.session?.access_token;

    const res = await fetch("/api/portfolio", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `Portfolio-${membre?.nom}.pdf`;

    a.click();

    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return <main className="card">Chargement…</main>;
  }

  const totalHeures = validations.reduce(
    (sum, v) => sum + Number(v.formation?.duree_heures ?? 0),
    0
  );

  return (
    <main className="card">

      <h1 className="h1">Mon portfolio</h1>

      <p className="p">
        Membre : <b>{membre.nom}</b>
      </p>

      <div className="row">

        <span className="badge">
          {validations.length} formations
        </span>

        <span className="badge">
          {totalHeures} heures
        </span>

      </div>

      <div style={{marginTop:12}}>
        <button className="button" onClick={downloadPdf}>
          Télécharger mon portfolio PDF
        </button>
      </div>

      <hr className="hr"/>

      <h2>Mes badges</h2>

      {validations.length === 0 && (
        <p className="p">Aucune formation validée.</p>
      )}

      <div className="badge-grid">

        {validations.map((v, idx) => (

          <div key={idx} className="badge-tile">

            <div className="badge-medal">
              {getBadgeIcon(v.formation?.titre, v.formation?.competences)}
            </div>

            <div>

              <div className="badge-tile-title">
                {v.formation?.titre}
              </div>

              <div className="badge-tile-meta">

                Formation certifiée

                <br/>

                Validée le {v.date_validation}

                <br/>

                Durée : {Number(v.formation?.duree_heures ?? 0)}h

                {v.formation?.niveau && (
                  <> • Niveau : {v.formation.niveau}</>
                )}

              </div>

            </div>

          </div>

        ))}

      </div>

    </main>
  );
}
