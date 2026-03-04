export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pdf, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  logo: { width: 120 },
  title: { fontSize: 18, marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#444" },
  small: { fontSize: 10, color: "#444" },
  sectionTitle: { fontSize: 13, marginTop: 14, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 8 },
  medalRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  medal: { fontSize: 14 },
});

export async function GET(request: Request) {
  // 1) Token (envoyé depuis /me via Authorization: Bearer ...)
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return new NextResponse("Not authenticated", { status: 401 });

  // 2) Client Supabase (au nom de l'utilisateur grâce au token)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // 3) Identifier l'utilisateur
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return new NextResponse("Not authenticated", { status: 401 });

  // 4) Trouver le membre
  const { data: membre } = await supabase
    .from("membres")
    .select("id, nom, email")
    .eq("auth_id", userData.user.id)
    .maybeSingle();

  if (!membre) return new NextResponse("Membre introuvable", { status: 404 });

  // 5) Charger les validations du membre
  const { data: validations, error } = await supabase
    .from("validations")
    .select("date_validation, formation:formations(titre, competences, duree_heures, niveau)")
    .eq("membre_id", membre.id)
    .order("date_validation", { ascending: false });

  if (error) return new NextResponse(error.message, { status: 500 });

  // 6) Résumé pro (nb + total heures + date)
  const totalHeures = (validations ?? []).reduce(
    (sum: number, v: any) => sum + Number(v.formation?.duree_heures ?? 0),
    0
  );
  const dateEdition = new Date().toLocaleDateString("fr-BE");

  const origin = new URL(request.url).origin;
  const logoUrl = `${origin}/logo.png`;

  // 7) Construire le PDF SANS JSX (compatible route.ts)
  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(Image, { src: logoUrl, style: styles.logo }),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.title }, "Portfolio de formations"),
          React.createElement(Text, { style: styles.subtitle }, `${membre.nom} — ${membre.email}`),
          React.createElement(
            Text,
            { style: styles.small },
            `Édité le ${dateEdition} • ${validations?.length ?? 0} formations • Total : ${totalHeures}h`
          )
        )
      ),

      // Liste
      React.createElement(Text, { style: styles.sectionTitle }, "Formations certifiées"),

      ...(validations && validations.length
        ? validations.map((v: any, idx: number) =>
            React.createElement(
              View,
              { key: String(idx), style: styles.card },
              React.createElement(
                View,
                { style: styles.medalRow },
                React.createElement(Text, { style: styles.medal }, "🏅"),
                React.createElement(Text, null, v.formation?.titre ?? "Formation")
              ),
              React.createElement(Text, { style: styles.small }, `Validée le ${v.date_validation}`),
              React.createElement(
                Text,
                { style: styles.small },
                `Durée : ${Number(v.formation?.duree_heures ?? 0)}h${
                  v.formation?.niveau ? ` • Niveau : ${v.formation.niveau}` : ""
                }`
              ),
              v.formation?.competences
                ? React.createElement(Text, { style: styles.small }, `Compétences : ${v.formation.competences}`)
                : null
            )
          )
        : [React.createElement(Text, { key: "empty" }, "Aucune formation validée.")])
    )
  );

  // 8) Générer + renvoyer en PDF (compatible NextResponse)
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
