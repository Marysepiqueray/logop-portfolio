"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AnnuairePage() {

  const [membres, setMembres] = useState<any[]>([]);
  const [domaines, setDomaines] = useState<any[]>([]);
  const [heures, setHeures] = useState<any>({});
  const [recherche, setRecherche] = useState("");
  const [domaineFiltre, setDomaineFiltre] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {

    const { data: membresData } = await supabase
      .from("membres")
      .select("*")
      .eq("annuaire_visible", true)
      .order("nom");

    const { data: domainesData } = await supabase
      .from("domaines")
      .select("*")
      .order("ordre");

    const { data: validations } = await supabase
      .from("validations")
      .select("membre_id, formation:formations(domaine_id, duree_heures)");

    const { data: activites } = await supabase
      .from("activites")
      .select("membre_id, domaine_id, duree_heures");

    const h: any = {};

    for (const v of validations ?? []) {

      const membre = v.membre_id;
      const domaine = v.formation?.domaine_id;
      const duree = v.formation?.duree_heures ?? 0;

      if (!h[membre]) h[membre] = {};
      if (!h[membre][domaine]) h[membre][domaine] = 0;

      h[membre][domaine] += duree;
    }

    for (const a of activites ?? []) {

      const membre = a.membre_id;
      const domaine = a.domaine_id;
      const duree = a.duree_heures ?? 0;

      if (!h[membre]) h[membre] = {};
      if (!h[membre][domaine]) h[membre][domaine] = 0;

      h[membre][domaine] += duree;
    }

    setMembres(membresData ?? []);
    setDomaines(domainesData ?? []);
    setHeures(h);
  }

  function niveau(h: number) {

    if (h >= 90) return "🥇 Expert";
    if (h >= 45) return "🥈 Confirmé";
    if (h >= 15) return "🥉 Formé";

    return null;
  }

  const membresFiltres = membres.filter((m) => {

    if (recherche &&
        !m.nom.toLowerCase().includes(recherche.toLowerCase())) {
      return false;
    }

    if (domaineFiltre) {

      const h = heures[m.id]?.[domaineFiltre] ?? 0;

      if (h === 0) return false;
    }

    return true;
  });

  return (
    <main className="container">

      <div className="card">

        <h1 className="h1">Annuaire des membres</h1>

        <div className="row">

          <input
            className="input"
            placeholder="Rechercher un membre"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          <select
            className="input"
            value={domaineFiltre}
            onChange={(e) => setDomaineFiltre(e.target.value)}
          >
            <option value="">Tous les domaines</option>

            {domaines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>

        </div>

      </div>

      <div className="badge-grid">

        {membresFiltres.map((m) => {

          const heuresDomaine = domaineFiltre
            ? heures[m.id]?.[domaineFiltre] ?? 0
            : null;

          return (

            <div key={m.id} className="badge-tile">

              <div>

                <div className="badge-tile-title">
                  {m.nom}
                </div>

                {m.ville && (
                  <div className="badge-tile-meta">
                    📍 {m.ville}
                  </div>
                )}

                {m.permis_conduire && (
                  <div className="badge-tile-meta">
                    🚗 Agréé permis de conduire
                  </div>
                )}

                {m.convention_visible && m.statut_convention && (
                  <div className="badge-tile-meta">
                    {m.statut_convention === "conventionne"
                      ? "✅ Conventionné"
                      : "⚪ Déconventionné"}
                  </div>
                )}

                {domaineFiltre && heuresDomaine > 0 && (

                  <div className="badge">
                    {niveau(heuresDomaine)} — {heuresDomaine}h
                  </div>

                )}

                {m.presentation && (

                  <div className="badge-tile-meta">
                    {m.presentation}
                  </div>

                )}

              </div>

            </div>

          );

        })}

      </div>

    </main>
  );
}
