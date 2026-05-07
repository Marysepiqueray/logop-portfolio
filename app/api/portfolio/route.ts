export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import React from "react";
const labels = {
  fr: {
    portfolio: "Portfolio professionnel",
    validatedTrainings: "Formations validées par année",
    formal: "Activités formelles",
    autonomous: "Activités autonomes",
    transmission: "Transmission / cours donnés",
    scientific: "Travaux scientifiques",
    certified: "Formation certifiée",
    duration: "Durée",
    level: "Niveau",
    validatedOn: "Validée le",
    editedOn: "Édité le",
    activities: "activités",
    trainings: "formations",
    total: "Total",
    viewLink: "Voir le lien",
  },

  nl: {
    portfolio: "Professioneel portfolio",
    validatedTrainings: "Gevalideerde opleidingen per jaar",
    formal: "Formele activiteiten",
    autonomous: "Autonome activiteiten",
    transmission: "Overdracht / gegeven lessen",
    scientific: "Wetenschappelijke werken",
    certified: "Gecertificeerde opleiding",
    duration: "Duur",
    level: "Niveau",
    validatedOn: "Gevalideerd op",
    editedOn: "Gegenereerd op",
    activities: "activiteiten",
    trainings: "opleidingen",
    total: "Totaal",
    viewLink: "Link bekijken",
  },

  de: {
    portfolio: "Professionelles Portfolio",
    validatedTrainings: "Validierte Fortbildungen nach Jahr",
    formal: "Formelle Aktivitäten",
    autonomous: "Selbstständige Aktivitäten",
    transmission: "Vermittlung / gehaltene Kurse",
    scientific: "Wissenschaftliche Arbeiten",
    certified: "Zertifizierte Fortbildung",
    duration: "Dauer",
    level: "Niveau",
    validatedOn: "Validiert am",
    editedOn: "Erstellt am",
    activities: "Aktivitäten",
    trainings: "Fortbildungen",
    total: "Gesamt",
    viewLink: "Link ansehen",
  },
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  logo: { width: 120 },
  title: { fontSize: 22, marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#555" },
  summary: { fontSize: 10, color: "#555", marginTop: 6 },

  sectionTitle: {
    fontSize: 14,
    marginTop: 18,
    marginBottom: 10,
    fontWeight: 700,
  },
  yearTitle: { fontSize: 13, marginTop: 12, marginBottom: 8 },

  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  icon: { fontSize: 14 },
  cardTitle: { fontSize: 12, fontWeight: 700 },
  meta: { fontSize: 10, color: "#555", marginTop: 2 },
  link: { fontSize: 10, color: "#2563eb", marginTop: 4 },
});

function getYear(date?: string | null) {
  return date ? String(date).slice(0, 4) : "Sans date";
}

function groupByYear(items: any[], getDate: (item: any) => string | null) {
  return items.reduce((acc: Record<string, any[]>, item: any) => {
    const year = getYear(getDate(item));
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});
}

function sectionLabel(categorie?: string | null) {
  if (categorie === "autonome") return "Activités autonomes";
  if (categorie === "transmission") return "Transmission / cours donnés";
  if (categorie === "scientifique") return "Travaux scientifiques";
  return "Activités formelles";
}

function typeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    formation_externe: "Formation externe",
    conference: "Conférence",
    webinaire: "Webinaire",
    lecture: "Lecture professionnelle",
    article: "Article scientifique",
    livre: "Livre",
    podcast: "Podcast",
    tfe: "TFE / mémoire",
    publication: "Publication",
    cours_donne: "Cours donné",
    supervision: "Supervision",
    innovation_ia: "Approches innovantes, outils numériques et IA",
  };

  return labels[type ?? ""] ?? "Activité";
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return new NextResponse("Not authenticated", { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData } = await supabase.auth.getUser(token);

  if (!userData.user) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const { data: membre } = await supabase
    .from("membres")
   .select("id, nom, email, langue")
    .eq("auth_id", userData.user.id)
    .maybeSingle();

  if (!membre) 
    const lang =
  membre.langue === "nl"
    ? "nl"
    : membre.langue === "de"
    ? "de"
    : "fr";

const t = labels[lang]; {
    return new NextResponse("Membre introuvable", { status: 404 });
  }

  const { data: validations, error: validationsError } = await supabase
    .from("validations")
    .select(
      "date_validation, formation:formations(titre, duree_heures, niveau, date_formation, date_fin_formation)"
    )
    .eq("membre_id", membre.id)
    .order("date_validation", { ascending: false });

  if (validationsError) {
    return new NextResponse(validationsError.message, { status: 500 });
  }

  const { data: activites, error: activitesError } = await supabase
    .from("activites")
    .select(
      "titre, organisme, date, duree_heures, type, categorie, description, lien, statut"
    )
    .eq("membre_id", membre.id)
    .order("date", { ascending: false });

  if (activitesError) {
    return new NextResponse(activitesError.message, { status: 500 });
  }

  const totalHeuresFormations = (validations ?? []).reduce(
    (sum: number, v: any) => sum + Number(v.formation?.duree_heures ?? 0),
    0
  );

  const totalHeuresActivites = (activites ?? []).reduce(
    (sum: number, a: any) => sum + Number(a.duree_heures ?? 0),
    0
  );

  const dateEdition = new Date().toLocaleDateString("fr-BE");
  const origin = new URL(request.url).origin;
  const logoUrl = `${origin}/logo.png`;

  const formationsByYear = groupByYear(validations ?? [], (v: any) => {
    return (
      v.formation?.date_fin_formation ||
      v.formation?.date_formation ||
      v.date_validation ||
      null
    );
  });

  const formationYears = Object.keys(formationsByYear).sort(
    (a, b) => Number(b) - Number(a)
  );

  const activitesByCategory = (activites ?? []).reduce(
    (acc: Record<string, any[]>, a: any) => {
      const key = a.categorie || "formelle";
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    },
    {}
  );

  const categories = ["formelle", "autonome", "transmission", "scientifique"];

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Image, { src: logoUrl, style: styles.logo }),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.title }, "Portfolio professionnel"),
          React.createElement(
            Text,
            { style: styles.subtitle },
            `${membre.nom} - ${membre.email}`
          ),
          React.createElement(
            Text,
            { style: styles.summary },
            `Édité le ${dateEdition} - ${(validations ?? []).length} formations - ${
              (activites ?? []).length
            } activités - Total : ${totalHeuresFormations + totalHeuresActivites}h`
          )
        )
      ),

      React.createElement(Text, { style: styles.sectionTitle }, "Formations validées par année"),

      ...(formationYears.length
        ? formationYears.flatMap((year) => [
            React.createElement(
              Text,
              { key: `year-${year}`, style: styles.yearTitle },
              year
            ),

            ...formationsByYear[year].map((v: any, i: number) =>
              React.createElement(
                View,
                { key: `${year}-${i}`, style: styles.card },
                React.createElement(
                  View,
                  { style: styles.row },
                  React.createElement(Text, { style: styles.icon }, "🏅"),
                  React.createElement(
                    Text,
                    { style: styles.cardTitle },
                    v.formation?.titre ?? "Formation"
                  )
                ),
                React.createElement(Text, { style: styles.meta }, "Formation certifiée"),
                React.createElement(
                  Text,
                  { style: styles.meta },
                  `Durée : ${Number(v.formation?.duree_heures ?? 0)}h${
                    v.formation?.niveau ? ` - Niveau : ${v.formation.niveau}` : ""
                  }`
                ),
                React.createElement(
                  Text,
                  { style: styles.meta },
                  `Validée le ${v.date_validation}`
                )
              )
            ),
          ])
        : [
            React.createElement(
              Text,
              { key: "empty-formations", style: styles.meta },
              "Aucune formation validée."
            ),
          ]),

      React.createElement(Text, { style: styles.sectionTitle }, "Autres activités du portfolio"),

      ...categories.flatMap((categorie) => {
        const items = activitesByCategory[categorie] ?? [];
        if (!items.length) return [];

        return [
          React.createElement(
            Text,
            { key: `section-${categorie}`, style: styles.yearTitle },
            sectionLabel(categorie)
          ),

          ...items.map((a: any, i: number) =>
            React.createElement(
              View,
              { key: `${categorie}-${i}`, style: styles.card },
              React.createElement(
                View,
                { style: styles.row },
                React.createElement(Text, { style: styles.icon }, "📌"),
                React.createElement(Text, { style: styles.cardTitle }, a.titre ?? "Activité")
              ),

              React.createElement(
                Text,
                { style: styles.meta },
                `${typeLabel(a.type)}${
                  a.organisme ? ` - ${a.organisme}` : ""
                }${a.date ? ` - ${a.date}` : ""}`
              ),

              Number(a.duree_heures ?? 0) > 0
                ? React.createElement(
                    Text,
                    { style: styles.meta },
                    `Durée : ${Number(a.duree_heures)}h`
                  )
                : null,

              a.description
                ? React.createElement(Text, { style: styles.meta }, a.description)
                : null,

              a.lien
                ? React.createElement(
                    Link,
                    { src: a.lien, style: styles.link },
                    "Voir le lien"
                  )
                : null
            )
          ),
        ];
      })
    )
  );

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Portfolio-${membre.nom}.pdf"`,
    },
  });
}
