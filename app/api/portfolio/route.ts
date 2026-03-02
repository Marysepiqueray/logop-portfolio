import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import React from "react";
import { pdf, Document, Page, Text, View, Image } from "@react-pdf/renderer";

export const runtime = "nodejs";

const e = React.createElement;

export async function GET(request: Request) {
  const s = supabaseServer();

  const { data: userData } = await s.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return new NextResponse("Non authentifié", { status: 401 });

  const { data: membre } = await s
    .from("membres")
    .select("id, nom, email")
    .eq("auth_id", userId)
    .maybeSingle();

  if (!membre) return new NextResponse("Non autorisé", { status: 403 });

  const { data: validations, error } = await s
    .from("validations")
    .select("date_validation, formation:formations(titre, competences, duree_heures, niveau)")
    .order("date_validation", { ascending: false });

  if (error) return new NextResponse(error.message, { status: 400 });

  const totalHeures = (validations ?? []).reduce(
    (sum: number, v: any) => sum + Number(v.formation?.duree_heures ?? 0),
    0
  );

  const origin = new URL(request.url).origin;
  const logoUrl = `${origin}/logo.png`;

  const header = e(
    View,
    { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
    e(Image, { src: logoUrl, style: { width: 140 } }),
    e(
      View,
      null,
      e(Text, { style: { fontSize: 16, marginBottom: 4 } }, "Portfolio de formations"),
      e(Text, null, "Logop’Aide et vous")
    )
  );

  const infoBox = e(
    View,
    { style: { marginTop: 18, padding: 12, borderWidth: 1, borderColor: "#ddd" } },
    e(Text, null, e(Text, { style: { fontWeight: 700 } }, "Membre : "), membre.nom),
    e(Text, null, e(Text, { style: { fontWeight: 700 } }, "Email : "), membre.email),
    e(Text, null, e(Text, { style: { fontWeight: 700 } }, "Date : "), new Date().toLocaleDateString("fr-BE")),
    e(Text, null, e(Text, { style: { fontWeight: 700 } }, "Formations validées : "), String(validations?.length ?? 0)),
    e(Text, null, e(Text, { style: { fontWeight: 700 } }, "Total heures : "), String(totalHeures))
  );

  const tableHeader = e(
    View,
    { style: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderColor: "#ddd" } },
    e(Text, { style: { width: "40%", fontWeight: 700 } }, "Formation"),
    e(Text, { style: { width: "18%", fontWeight: 700 } }, "Date"),
    e(Text, { style: { width: "12%", fontWeight: 700 } }, "Durée"),
    e(Text, { style: { width: "30%", fontWeight: 700 } }, "Compétences")
  );

  const tableRows = (validations ?? []).map((v: any, idx: number) =>
    e(
      View,
      { key: idx, style: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderColor: "#eee" } },
      e(Text, { style: { width: "40%" } }, v.formation?.titre ?? ""),
      e(Text, { style: { width: "18%" } }, String(v.date_validation ?? "")),
      e(Text, { style: { width: "12%" } }, `${Number(v.formation?.duree_heures ?? 0)}h`),
      e(Text, { style: { width: "30%" } }, v.formation?.competences ?? "")
    )
  );

  const table = e(
    View,
    { style: { marginTop: 8, borderWidth: 1, borderColor: "#ddd" } },
    tableHeader,
    ...tableRows
  );

  const footer = e(
    Text,
    { style: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 9, color: "#666" } },
    "Document interne – Logop’Aide et vous"
  );

  const doc = e(
    Document,
    null,
    e(
      Page,
      { size: "A4", style: { padding: 32, fontSize: 11 } },
      header,
      infoBox,
      e(Text, { style: { marginTop: 18, fontSize: 13, fontWeight: 700 } }, "Détail des formations"),
      table,
      footer
    )
  );

  const buffer = await pdf(doc).toBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Portfolio-${membre.nom}.pdf"`,
    },
  });
}
