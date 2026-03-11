"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AnnuairePage() {
  const [membres, setMembres] = useState<any[]>([]);
  const [domaines, setDomaines] = useState<any[]>([]);
  const [heures, setHeures] = useState<Record<string, Record<string, number>>>({});
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
      .eq("membre_asbl", true)
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

    const h: Record<string, Record<string, number>> = {};

    for (const v of (validations ?? []) as any[]) {
      const membre = v.membre_id as string;
      const formation = v.formation as any;
      const domaine = formation?.domaine_id as string | undefined;
      const duree = Number(formation?.duree_heures ?? 0);

      if (!membre || !domaine) continue;

      if (!h[membre]) h[membre] = {};
      if (!h[membre][domaine]) h[membre][domaine] = 0;

      h[membre][domaine] += duree;
    }

    for (const a of (activites ?? []) as any[]) {
      const membre = a.membre_id as string;
      const domaine = a.domaine_id as string | undefined;
      const duree = Number(a.duree_heures ?? 0);

      if (!membre || !domaine) continue;

      if (!h[membre]) h[membre] = {};
      if (!h[membre][domaine]) h[membre][domaine] = 0;

      h[membre][domaine] += duree;
    }

    setMembres(membresData ?? []);
    setDomaines(domainesData ?? []);
    setHeures(h);
  }

  function niveau(h: number) {
    if (h >= 120) return "🏆 Expert";
    if (h >= 90) return "🥇 Expert";
    if (h >= 45) return "🥈 Confirmé";
    if (h >= 15) return "🥉 Formé";
    return null;
  }

  function topSpecialites(membreId: string) {
    const h = heures[membreId] || {};

    return Object.entries(h)
      .map(([domaineId, nbHeures]) => {
        const domaine = domaines.find((d) => d.id === domaineId);

        return {
          domaine: domaine?.nom ?? "Domaine",
          heures: Number(nbHeures),
        };
      })
      .filter((x) => x.heures >= 15)
      .sort((a, b) => b.heures - a.heures)
      .slice(0, 3);
  }

const membresFiltres = membres
  .filter((m) => {

    if (recherche &&
        !(m.nom ?? "").toLowerCase().includes(recherche.toLowerCase())) {
      return false;
    }

    if (domaineFiltre) {
      const h = heures[m.id]?.[domaineFiltre] ?? 0;
      if (h === 0) return false;
    }

    return true;
  })
  .sort((a, b) => {

    if (!domaineFiltre) {
      return (a.nom ?? "").localeCompare(b.nom ?? "");
    }

    const ha = heures[a.id]?.[domaineFiltre] ?? 0;
    const hb = heures[b.id]?.[domaineFiltre] ?? 0;

    return hb - ha;

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
          const heuresDomaine = domaineFiltre ? heures[m.id]?.[domaineFiltre] ?? 0 : null;
          const specialites = topSpecialites(m.id);

          return (
            <div key={m.id} className="badge-tile" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <div className="badge-tile-title">{m.nom}</div>

                {specialites.length > 0 && (
                  <div style={{ display: "grid", gap: 4, marginBottom: 8 }}>
                    {specialites.map((s: any, i: number) => (
                      <div key={i} className="badge-tile-meta">
                        {s.heures >= 120 && "🏆"}
                        {s.heures >= 90 && s.heures < 120 && "🥇"}
                        {s.heures >= 45 && s.heures < 90 && "🥈"}
                        {s.heures >= 15 && s.heures < 45 && "🥉"}{" "}
                        {s.domaine}
                      </div>
                    ))}
                  </div>
                )}

                {m.ville && (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    📍 {m.ville}
                  </div>
                )}

                {m.permis_conduire && (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    🚗 Agréé.e permis de conduire
                  </div>
                )}

                {m.convention_visible && m.statut_convention && (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    {m.statut_convention === "conventionne"
                      ? "✅ Conventionné.e"
                      : "⚪ Déconventionné.e"}
                  </div>
                )}

                {domaineFiltre && heuresDomaine > 0 && (
                  <div className="badge" style={{ marginBottom: 8 }}>
                    {niveau(heuresDomaine)} — {heuresDomaine}h
                  </div>
                )}

                {m.presentation && (
                  <div className="badge-tile-meta">{m.presentation}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
