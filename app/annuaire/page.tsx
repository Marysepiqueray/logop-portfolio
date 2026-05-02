"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = {
  id: string;
  ordre: number;
  nom: string;
  description: string;
};

const labels = {
  fr: {
    loading: "Chargement…",
    title: "Annuaire des logopèdes",
    intro:
      "Retrouvez les membres visibles dans l’annuaire selon leur localisation, leurs domaines de compétence et leurs langues cliniques de rééducation.",
    search: "Nom, domaine, langue…",
    city: "Ville ou code postal",
    allDomains: "Tous les domaines",
    allLanguages: "Toutes les langues cliniques de rééducation",
    noResult: "Aucun membre ne correspond à votre recherche.",
    driving: "Agréé.e permis de conduire",
    conventionne: "Conventionné.e",
    deconventionne: "Déconventionné.e",
    languages: "Langues cliniques de rééducation :",
    domains: "Domaines de compétence",
    noDomain: "Aucun domaine encore atteint.",
    contact: "Contacter",
  },
  nl: {
    loading: "Laden…",
    title: "Gids van logopedisten",
    intro:
      "Vind zichtbare leden op basis van locatie, competentiedomeinen en klinische revalidatietalen.",
    search: "Naam, domein, taal…",
    city: "Stad of postcode",
    allDomains: "Alle domeinen",
    allLanguages: "Alle klinische revalidatietalen",
    noResult: "Geen lid komt overeen met uw zoekopdracht.",
    driving: "Erkend voor rijgeschiktheid",
    conventionne: "Geconventioneerd",
    deconventionne: "Niet-geconventioneerd",
    languages: "Klinische revalidatietalen:",
    domains: "Competentiedomeinen",
    noDomain: "Nog geen domein bereikt.",
    contact: "Contact opnemen",
  },
  de: {
    loading: "Wird geladen…",
    title: "Verzeichnis der Logopädinnen und Logopäden",
    intro:
      "Finden Sie sichtbare Mitglieder nach Standort, Kompetenzbereichen und klinischen Rehabilitationssprachen.",
    search: "Name, Bereich, Sprache…",
    city: "Stadt oder Postleitzahl",
    allDomains: "Alle Bereiche",
    allLanguages: "Alle klinischen Rehabilitationssprachen",
    noResult: "Kein Mitglied entspricht Ihrer Suche.",
    driving: "Anerkannt für Fahreignung",
    conventionne: "Konventioniert",
    deconventionne: "Nicht konventioniert",
    languages: "Klinische Rehabilitationssprachen:",
    domains: "Kompetenzbereiche",
    noDomain: "Noch kein Bereich erreicht.",
    contact: "Kontaktieren",
  },
};

function medal(hours: number) {
  if (hours >= 120) return { label: "EXPERT", icon: "🏆", score: 4 };
  if (hours >= 90) return { label: "OR", icon: "🥇", score: 3 };
  if (hours >= 45) return { label: "ARGENT", icon: "🥈", score: 2 };
  if (hours >= 15) return { label: "BRONZE", icon: "🥉", score: 1 };
  return { label: "AUCUN", icon: "⬜", score: 0 };
}

export default function AnnuairePage() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"fr" | "nl" | "de">("fr");

  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [membres, setMembres] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [activites, setActivites] = useState<any[]>([]);
  const [languesDisponibles, setLanguesDisponibles] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [villeSearch, setVilleSearch] = useState("");
  const [domaineSearch, setDomaineSearch] = useState("");
  const [langueSearch, setLangueSearch] = useState("");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "fr" | "nl" | "de" | null;
    if (savedLang === "fr" || savedLang === "nl" || savedLang === "de") {
      setLang(savedLang);
    }

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

      const { data: langues } = await supabase
        .from("langues_reeducation")
        .select("id, nom")
        .order("nom", { ascending: true });

      const { data: m } = await supabase
        .from("membres")
        .select(
          "id, nom, email, ville, code_postal, presentation, annuaire_visible, role, permis_conduire, statut_convention, convention_visible, membre_langues_reeducation(langue_id, langues_reeducation(nom))"
        )
        .eq("annuaire_visible", true)
        .eq("role", "membre")
        .eq("membre_asbl", true);

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
      setLanguesDisponibles(langues ?? []);
      setMembres(m ?? []);
      setValidations(v);
      setActivites(a);
      setLoading(false);
    })();
  }, []);

  const annuaire = useMemo(() => {
    const heuresParMembre: Record<string, Record<string, number>> = {};

    for (const m of membres) {
      heuresParMembre[m.id] = {};
    }

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
        .sort((a, b) => {
          if (b.medal.score !== a.medal.score) return b.medal.score - a.medal.score;
          return b.heures - a.heures;
        });

      const expertiseScore = domainesMembre.reduce(
        (sum, d) => sum + d.medal.score,
        0
      );

      return {
        ...m,
        domaines: domainesMembre,
        expertiseScore,
      };
    });
  }, [membres, validations, activites, domaines]);

  const filtered = useMemo(() => {
    const normalize = (value: string) =>
      (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    return annuaire
      .filter((m) => {
        const searchValue = normalize(search);
        const villeValue = normalize(villeSearch);

        const nom = normalize(m.nom ?? "");
        const nomInverse = nom.split(" ").reverse().join(" ");
        const presentation = normalize(m.presentation ?? "");
        const lieuTexte = normalize(`${m.ville ?? ""} ${m.code_postal ?? ""}`);

        const domainesTexte = normalize(
          (m.domaines ?? []).map((d: any) => d.nom).join(" ")
        );

        const languesTexte = normalize(
          (m.membre_langues_reeducation ?? [])
            .map((x: any) => x.langues_reeducation?.nom ?? "")
            .join(" ")
        );

        const okSearch =
          !searchValue ||
          nom.includes(searchValue) ||
          nomInverse.includes(searchValue) ||
          presentation.includes(searchValue) ||
          lieuTexte.includes(searchValue) ||
          domainesTexte.includes(searchValue) ||
          languesTexte.includes(searchValue);

        const okVille = !villeValue || lieuTexte.includes(villeValue);

        const okDomaine =
          !domaineSearch || m.domaines.some((d: any) => d.id === domaineSearch);

        const okLangue =
          !langueSearch ||
          (m.membre_langues_reeducation ?? []).some(
            (x: any) => x.langue_id === langueSearch
          );

        return okSearch && okVille && okDomaine && okLangue;
      })
      .sort((a, b) => {
        if (b.expertiseScore !== a.expertiseScore) {
          return b.expertiseScore - a.expertiseScore;
        }
        return a.nom.localeCompare(b.nom);
      });
  }, [annuaire, search, villeSearch, domaineSearch, langueSearch]);

  const t = labels[lang];

  if (loading) {
    return <main className="card">{t.loading}</main>;
  }

  return (
    <main className="card">
      <h1 className="h1">{t.title}</h1>

      <p className="p">{t.intro}</p>

      <div style={{ display: "grid", gap: 10, maxWidth: 900, marginTop: 10 }}>
        <div className="row">
          <input
            className="input"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            className="input"
            placeholder={t.city}
            value={villeSearch}
            onChange={(e) => setVilleSearch(e.target.value)}
          />
        </div>

        <div className="row">
          <select
            className="input"
            value={domaineSearch}
            onChange={(e) => setDomaineSearch(e.target.value)}
          >
            <option value="">{t.allDomains}</option>
            {domaines.map((d) => (
             <option key={d.id} value={d.id}>
  {getText(d, "nom", lang)}
</option>
            ))}
          </select>

          <select
            className="input"
            value={langueSearch}
            onChange={(e) => setLangueSearch(e.target.value)}
          >
            <option value="">{t.allLanguages}</option>
            {languesDisponibles.map((l: any) => (
              <option key={l.id} value={l.id}>
                {l.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="hr" />

      {filtered.length === 0 ? (
        <p className="p">{t.noResult}</p>
      ) : (
        <div className="badge-grid">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="badge-tile"
              style={{ gridTemplateColumns: "1fr" }}
            >
              <div>
                <a
                  href={`/annuaire/${m.id}`}
                  className="badge-tile-title"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {m.nom}
                </a>

                {m.ville || m.code_postal ? (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    📍 {[m.code_postal, m.ville].filter(Boolean).join(" ")}
                  </div>
                ) : null}

                {m.permis_conduire ? (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    🚗 {t.driving}
                  </div>
                ) : null}

                {m.convention_visible && m.statut_convention ? (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    {m.statut_convention === "conventionne"
                      ? `✅ ${t.conventionne}`
                      : `⚪ ${t.deconventionne}`}
                  </div>
                ) : null}

                {m.membre_langues_reeducation &&
                m.membre_langues_reeducation.length > 0 ? (
                  <div className="badge-tile-meta" style={{ marginBottom: 6 }}>
                    🌍 {t.languages}{" "}
                    {m.membre_langues_reeducation
                      .map((x: any) => x.langues_reeducation?.nom)
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                ) : null}

                {m.presentation ? (
                  <div className="badge-tile-meta" style={{ marginBottom: 10 }}>
                    {m.presentation}
                  </div>
                ) : null}

                <div
                  className="badge-tile-meta"
                  style={{ marginBottom: 6, fontWeight: 700 }}
                >
                  {t.domains}
                </div>

                {m.domaines.length === 0 ? (
                  <div className="badge-tile-meta">{t.noDomain}</div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {m.domaines.slice(0, 4).map((d: any) => (
                      <div key={d.id} className="small">
                        {d.medal.icon} {d.nom} — {d.heures}h
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <a className="button secondary" href={`mailto:${m.email}`}>
                    {t.contact}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
