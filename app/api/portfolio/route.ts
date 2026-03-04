import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Document, Page, Text, View, Image, StyleSheet, pdf } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  logo: { width: 120 },
  title: { fontSize: 18, marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#444" },
  sectionTitle: { fontSize: 13, marginTop: 14, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 8 },
  medalRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 4 },
  medal: { fontSize: 14 },
  small: { fontSize: 10, color: "#444" },
});

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
  if (!userData.user) return new NextResponse("Not authenticated", { status: 401 });

  const { data: membre } = await supabase
    .from("membres")
    .select("id, nom, email")
    .eq("auth_id", userData.user.id)
    .maybeSingle();

  if (!membre) return new NextResponse("Membre introuvable", { status: 404 });

  const { data: validations, error } = await supabase
    .from("validations")
    .select("date_validation, formation:formations(titre, competences, duree_heures, niveau)")
    .eq("membre_id", membre.id)
    .order("date_validation", { ascending: false });

  if (error) return new NextResponse(error.message, { status: 500 });

  const origin = new URL(request.url).origin;
  const logoUrl = `${origin}/logo.png`;

  const PortfolioDoc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Image src={logoUrl} style={styles.logo} />
          <View>
            <Text style={styles.title}>Portfolio de formations</Text>
            <Text style={styles.subtitle}>
              {membre.nom} — {membre.email}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Formations certifiées</Text>

        {(validations ?? []).length === 0 ? (
          <Text>Aucune formation validée.</Text>
        ) : (
          (validations ?? []).map((v: any, idx: number) => (
            <View key={idx} style={styles.card}>
              <View style={styles.medalRow}>
                <Text style={styles.medal}>🏅</Text>
                <Text>{v.formation?.titre ?? "Formation"}</Text>
              </View>
              <Text style={styles.small}>Validée le {v.date_validation}</Text>
              <Text style={styles.small}>
                Durée : {Number(v.formation?.duree_heures ?? 0)}h
                {v.formation?.niveau ? ` • Niveau : ${v.formation.niveau}` : ""}
              </Text>
              {v.formation?.competences ? (
                <Text style={styles.small}>Compétences : {v.formation.competences}</Text>
              ) : null}
            </View>
          ))
        )}
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
