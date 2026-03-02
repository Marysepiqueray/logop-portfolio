import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { pdf, Document, Page, Text, View, Image } from "@react-pdf/renderer";

export const runtime = "nodejs";

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

  const PortfolioDoc = (
    <Document>
      <Page size="A4" style={{ padding: 32, fontSize: 11 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Image src={logoUrl} style={{ width: 140 }} />
          <View>
            <Text style={{ fontSize: 16, marginBottom: 4 }}>Portfolio de formations</Text>
            <Text>Logop’Aide et vous</Text>
          </View>
        </View>

        <View style={{ marginTop: 18, padding: 12, borderWidth: 1, borderColor: "#ddd" }}>
          <Text><Text style={{ fontWeight: 700 }}>Membre :</Text> {membre.nom}</Text>
          <Text><Text style={{ fontWeight: 700 }}>Email :</Text> {membre.email}</Text>
          <Text><Text style={{ fontWeight: 700 }}>Date :</Text> {new Date().toLocaleDateString("fr-BE")}</Text>
          <Text><Text style={{ fontWeight: 700 }}>Formations validées :</Text> {validations?.length ?? 0}</Text>
          <Text><Text style={{ fontWeight: 700 }}>Total heures :</Text> {totalHeures}</Text>
        </View>

        <Text style={{ marginTop: 18, fontSize: 13, fontWeight: 700 }}>Détail des formations</Text>

        <View style={{ marginTop: 8, borderWidth: 1, borderColor: "#ddd" }}>
          <View style={{ flexDirection: "row", padding: 8, borderBottomWidth: 1, borderColor: "#ddd", fontWeight: 700 }}>
            <Text style={{ width: "40%" }}>Formation</Text>
            <Text style={{ width: "18%" }}>Date</Text>
            <Text style={{ width: "12%" }}>Durée</Text>
            <Text style={{ width: "30%" }}>Compétences</Text>
          </View>

          {(validations ?? []).map((v: any, idx: number) => (
            <View key={idx} style={{ flexDirection: "row", padding: 8, borderBottomWidth: 1, borderColor: "#eee" }}>
              <Text style={{ width: "40%" }}>{v.formation?.titre ?? ""}</Text>
              <Text style={{ width: "18%" }}>{v.date_validation}</Text>
              <Text style={{ width: "12%" }}>{Number(v.formation?.duree_heures ?? 0)}h</Text>
              <Text style={{ width: "30%" }}>{v.formation?.competences ?? ""}</Text>
            </View>
          ))}
        </View>

        <Text style={{ position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 9, color: "#666" }}>
          Document interne – Logop’Aide et vous
        </Text>
      </Page>
    </Document>
  );

  const buffer = await pdf(PortfolioDoc).toBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Portfolio-${membre.nom}.pdf"`,
    },
  });
}
