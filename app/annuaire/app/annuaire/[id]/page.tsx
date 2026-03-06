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
        .select("id, nom, email, ville, presentation, annuaire_visible, role")
        .eq("id", params.id)
        .eq("annuaire_visible", true)
        .eq("role", "membre")
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
      .sort((a, b) => b.heures - a.heures);
  }, [domaines, validations, activites]);

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

      {membre.ville ? (
        <p className="p">📍 {membre.ville}</p>
      ) : null}

      {membre.presentation ? (
        <p className="p">{membre.presentation}</p>
      ) : null}

      <div className="small" style={{ marginBottom: 16 }}>
        ✉️ {membre.email}
      </div>

      <hr className="hr" />

      <h2>Domaines de compétence</h2>

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
