export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pdf, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  logo: { width: 120 },
  title: { fontSize: 22, marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#555" },
  summary: { fontSize: 10, color: "#555", marginTop: 6 },

  sectionTitle: { fontSize: 13, marginTop: 16, marginBottom: 10 },

  badge: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, marginBottom: 10 },
  badgeRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 4 },
  medal: { fontSize: 16 },
  badgeTitle: { fontSize: 13 },
  badgeMeta: { fontSize: 10, color: "#555" },
});

export async function GET(request: Request) {
  // Token
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return new NextResponse("Not authenticated", { status: 401 });

  // Supabase client user-scoped
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return new NextResponse("Not authenticated", { status: 401 });

  const { data: membre } = await supabase
    .from("membres")
    .select("id, nom, email")
    .eq("auth_id", userData.user.id)
    .maybeSingle();

  if (!membre) return new NextResponse("Membre introuvable", { status: 404 });

  const { data: validations, error } = await supabase
    .from("validations")
    .select("date_validation, formation:formations(titre, duree_heures, niveau)")
    .eq("membre_id", membre.id)
    .order("date_validation", { ascending: false });

  if (error) return new NextResponse(error.message, { status: 500 });

  const totalHeures = (validations ?? []).reduce(
    (sum: number, v: any) => sum + Number(v.formation?.duree_heures ?? 0),
    0
  );
  const dateEdition = new Date().toLocaleDateString("fr-BE");

  const origin = new URL(request.url).origin;
  const logoUrl = `${origin}/logo.png`;

  // Document sans JSX
  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Image, { src: logoUrl, style: styles.logo }),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.title }, "Portfolio de formation"),
          React.createElement(Text, { style: styles.subtitle }, `${membre.nom} — ${membre.email}`),
          React.createElement(
            Text,
            { style: styles.summary },
            `Édité le ${dateEdition} • ${validations?.length ?? 0} formations • Total : ${totalHeures}h`
          )
        )
      ),

      React.createElement(Text, { style: styles.sectionTitle }, "Certifications"),

      ...(validations && validations.length
        ? validations.map((v: any, i: number) =>
            React.createElement(
              View,
              { key: String(i), style: styles.badge },
              React.createElement(
                View,
                { style: styles.badgeRow },
                React.createElement(Text, { style: styles.medal }, "🏅"),
                React.createElement(Text, { style: styles.badgeTitle }, v.formation?.titre ?? "Formation")
              ),
              React.createElement(Text, { style: styles.badgeMeta }, "Formation certifiée"),
              React.createElement(
                Text,
                { style: styles.badgeMeta },
                `Durée : ${Number(v.formation?.duree_heures ?? 0)}h${v.formation?.niveau ? ` • Niveau : ${v.formation.niveau}` : ""}`
              ),
              React.createElement(Text, { style: styles.badgeMeta }, `Validée le ${v.date_validation}`)
            )
          )
        : [React.createElement(Text, { key: "empty" }, "Aucune formation validée.")])
    )
  );

  // Génération PDF compatible NextResponse
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
