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

export default function AnnuairePage() {
  const [loading, setLoading] = useState(true);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [activites, setActivites] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [villeSearch, setVilleSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        window.location.href = "/";
        return;
      }

      const { data: d } = await supabase
        .from("domaines")
        .select("id, ordre, nom, description")
        .order("ordre", { ascending: true });

      const { data: m } = await supabase
        .from("membres")
        .select("id, nom, email, ville, presentation, annuaire_visible, role")
        .eq("annuaire_visible", true)
        .eq("role", "membre");

      const membreIds = (m ?? []).map((x: any) => x.id);

      let v: any[] = [];
      let a: any[] = [];

      if (membreIds.length > 0) {
        const validationsRes = await supabase
          .from("validations")
          .select("membre_id, formation:formations(domaine_id, duree_heures)")
          .in("membre_id", membreIds);

        const activitesRes = await supabase
          .from("activites")
          .select("membre_id, domaine_id, duree_heures, type")
          .in("membre_id", membreIds);

        v = validationsRes.data ?? [];
        a = activitesRes.data ?? [];
      }

      setDomaines((d ?? []) as any);
      setMembres(m ?? []);
      setValidations(v);
      setActivites(a);
      setLoading(false);
    })();
  }, []);

  const annuaire = useMemo(() => {
    const heuresParMembre: Record<string, Record<string, number>> = {};

    for (const m of membres) heuresParMembre[m.id] = {};

    for (const row of validations as any[]) {
      const mid = row.membre_id as string;
      const formation = row.formation as any;
      const dom = formation?.domaine_id as string | undefined;
      if (!mid || !dom) continue;

      const h = Number(formation?.duree_heures ?? 0);
      heuresParMembre[mid][dom] = (heuresParMembre[mid][dom] ?? 0) + h;
    }

    for (const row of activites as any[]) {
      const mid = row.membre_id as string;
      const dom = row.domaine_id as string | undefined;
      if (!mid || !dom) continue;

      const h = Number(row.duree_heures ?? 0);
      heuresParMembre[mid][dom] = (heuresParMembre[mid][dom] ?? 0) + h;
    }

    return membres.map((m) => {
      const domainesMembre = domaines
        .map((d) => {
          const h = Number(heuresParMembre[m.id]?.[d.id] ?? 0);
          const med = medal(h);
          return {
            id: d.id,
            nom: d.nom,
            heures: h,
            medal: med,
          };
        })
        .filter((d) => d.medal.label !== "AUCUN")
        .sort((a, b) => b.heures - a.heures);

      return {
        ...m,
        domaines: domainesMembre,
      };
    });
  }, [membres, validations, activites, domaines]);

  const filtered = useMemo(() => {
    return annuaire.filter((m) => {
      const text = (
        (m.nom ?? "") +
        " " +
        (m.ville ?? "") +
        " " +
        (m.presentation ?? "") +
        " " +
        m.domaines.map((d: any) => d.nom).join(" ")
      ).toLowerCase();

      const okSearch = text.includes(search.toLowerCase());
      const okVille = (m.ville ?? "").toLowerCase().includes(villeSearch.toLowerCase());

      return okSearch && okVille;
    });
  }, [annuaire, search, villeSearch]);

  if (loading) return <main className="card">Chargement…</main>;

  return (
    <main className="card">
      <h1 className="h1">Annuaire des logopèdes</h1>

      <p className="p">
        Retrouvez les membres visibles dans l’annuaire en fonction de leur localisation et de leurs domaines de compétence.
      </p>

      <div className="row" style={{ marginTop: 10 }}>
        <input
          className="input"
          placeholder="Rechercher un nom, un domaine…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          className="input"
          placeholder="Ville"
          value={villeSearch}
          onChange={(e) => setVilleSearch(e.target.value)}
        />
      </div>

      <hr className="hr" />

      {filtered.length === 0 ? (
        <p className="p">Aucun membre ne correspond à votre recherche.</p>
      ) : (
        <div className="badge-grid">
          {filtered.map((m) => (
            <div key={m.id} className="badge-tile" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <div className="badge-tile-title">{m.nom}</div>

                {m.ville ? (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    📍 {m.ville}
                  </div>
                ) : null}

                {m.presentation ? (
                  <div className="badge-tile-meta" style={{ marginBottom: 10 }}>
                    {m.presentation}
                  </div>
                ) : null}

                <div className="badge-tile-meta" style={{ marginBottom: 6, fontWeight: 700 }}>
                  Domaines de compétence
                </div>

                {m.domaines.length === 0 ? (
                  <div className="badge-tile-meta">Aucun domaine encore atteint.</div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {m.domaines.slice(0, 4).map((d: any) => (
                      <div key={d.id} className="small">
                        {d.medal.icon} {d.nom} — {d.heures}h
                      </div>
                    ))}
                  </div>
                )}

                <div className="badge-tile-meta" style={{ marginTop: 10 }}>
                  ✉️ {m.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
