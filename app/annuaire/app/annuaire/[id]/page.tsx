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
  if (hours >= 120) return { label: "EXPERT", icon: "🏆", score: 4 };
  if (hours >= 90) return { label: "OR", icon: "🥇", score: 3 };
  if (hours >= 45) return { label: "ARGENT", icon: "🥈", score: 2 };
  if (hours >= 15) return { label: "BRONZE", icon: "🥉", score: 1 };
  return { label: "AUCUN", icon: "⬜", score: 0 };
}

export default function ProfilAnnuairePage({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(true);
  const [membre, setMembre] = useState<any>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [activites, setActivites] = useState<any[]>([]);

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
        .select(
          "id, nom, email, ville, presentation, annuaire_visible, role, permis_conduire, statut_convention, convention_visible, membre_langues_reeducation(langue_id, langues_reeducation(nom))"
        )
        .eq("id", params.id)
        .eq("annuaire_visible", true)
        .eq("role", "membre")
        .eq("membre_asbl", true)
        .maybeSingle();

      if (!m) {
        window.location.href = "/annuaire";
        return;
      }

      const { data: d } = await supabase
        .from("domaines")
        .select("id, ordre, nom, description")
        .order("ordre", { ascending: true });

      const validationsRes = await supabase
        .from("validations")
        .select("membre_id, formation:formations(domaine_id, duree_heures)")
        .eq("membre_id", params.id);

      const activitesRes = await supabase
        .from("activites")
        .select("membre_id, domaine_id, duree_heures, type")
        .eq("membre_id", params.id);

      setMembre(m);
      setDomaines((d ?? []) as any);
      setValidations(validationsRes.data ?? []);
      setActivites(activitesRes.data ?? []);
      setLoading(false);
    })();
  }, [params.id]);

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

    return domaines
      .map((d) => {
        const h = Number(heures[d.id] ?? 0);
        const med = medal(h);

        return {
          domaine: d,
          heures: h,
          medal: med,
        };
      })
      .filter((x) => x.medal.label !== "AUCUN")
      .sort((a, b) => {
        if (b.medal.score !== a.medal.score) return b.medal.score - a.medal.score;
        return b.heures - a.heures;
      });
  }, [domaines, validations, activites]);

  const top3 = passeport.slice(0, 3);

  if (loading) {
    return <main className="card">Chargement…</main>;
  }

  return (
    <main className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>
          {membre.nom}
        </h1>

        <a className="button secondary" href="/annuaire">
          Retour à l’annuaire
        </a>
      </div>

      {membre.ville ? <p className="p">📍 {membre.ville}</p> : null}

      {membre.permis_conduire ? (
        <p className="p">🚗 Agréé.e permis de conduire</p>
      ) : null}

      {membre.convention_visible && membre.statut_convention ? (
        <p className="p">
          {membre.statut_convention === "conventionne"
            ? "✅ Conventionné.e"
            : "⚪ Déconventionné.e"}
        </p>
      ) : null}

      {membre.membre_langues_reeducation &&
      membre.membre_langues_reeducation.length > 0 ? (
        <p className="p">
          🌍 Langues cliniques de rééducation :{" "}
          {membre.membre_langues_reeducation
            .map((x: any) => x.langues_reeducation?.nom)
            .filter(Boolean)
            .join(", ")}
        </p>
      ) : null}

      {membre.presentation ? <p className="p">{membre.presentation}</p> : null}

      <div style={{ marginBottom: 16 }}>
        <a className="button secondary" href={`mailto:${membre.email}`}>
          Contacter
        </a>
      </div>

      <hr className="hr" />

      <h2>Domaines principaux</h2>

      {top3.length === 0 ? (
        <p className="p">Aucun domaine encore atteint.</p>
      ) : (
        <div className="row" style={{ marginTop: 10 }}>
          {top3.map((p) => (
            <span key={p.domaine.id} className="badge">
              {p.medal.icon} {p.domaine.nom} — {p.heures}h
            </span>
          ))}
        </div>
      )}

      <hr className="hr" />

      <h2>Tous les domaines de compétence</h2>

      {passeport.length === 0 ? (
        <p className="p">Aucun domaine encore atteint.</p>
      ) : (
        <div className="badge-grid">
          {passeport.map((p) => (
            <div key={p.domaine.id} className="badge-tile">
              <div className="badge-medal">{p.medal.icon}</div>

              <div>
                <div className="badge-tile-title">{p.domaine.nom}</div>

                <div className="badge-tile-meta" style={{ marginBottom: 8 }}>
                  {p.domaine.description}
                </div>

                <div className="badge-tile-meta">
                  {p.medal.label} — {p.heures}h
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
