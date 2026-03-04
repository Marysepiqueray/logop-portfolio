import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { pdf, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export async function GET(req: Request) {

  const auth = req.headers.get("authorization");

  if (!auth) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const token = auth.replace("Bearer ", "");

  const supabase = supabaseServer(token);

  const { data: user } = await supabase.auth.getUser();

  if (!user?.user) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const { data: membre } = await supabase
    .from("membres")
    .select("*")
    .eq("auth_id", user.user.id)
    .single();

  const { data: validations } = await supabase
    .from("validations")
    .select("date_validation, formation:formations(titre,duree_heures,niveau)")
    .eq("membre_id", membre.id);

  const styles = StyleSheet.create({

    page: {
      padding:40,
      fontSize:11
    },

    header:{
      marginBottom:30,
      flexDirection:"row",
      justifyContent:"space-between",
      alignItems:"center"
    },

    logo:{
      width:120
    },

    title:{
      fontSize:24,
      marginBottom:6
    },

    subtitle:{
      fontSize:14,
      color:"#666"
    },

    badge:{
      border:"1px solid #ddd",
      borderRadius:12,
      padding:14,
      marginBottom:12
    },

    badgeTitle:{
      fontSize:14,
      fontWeight:"bold",
      marginBottom:4
    },

    badgeMeta:{
      fontSize:11,
      color:"#555"
    }

  });

  const logoUrl = new URL("/logo.png", req.url).toString();

  const doc = (
    <Document>

      <Page size="A4" style={styles.page}>

        <View style={styles.header}>

          <Image src={logoUrl} style={styles.logo}/>

          <View>
            <Text style={styles.title}>Portfolio de formation</Text>
            <Text style={styles.subtitle}>
              {membre.nom}
            </Text>
          </View>

        </View>

        {validations?.map((v, i) => (

          <View key={i} style={styles.badge}>

            <Text style={styles.badgeTitle}>
              {v.formation?.titre}
            </Text>

            <Text style={styles.badgeMeta}>
              Formation certifiée
            </Text>

            <Text style={styles.badgeMeta}>
              Durée : {v.formation?.duree_heures ?? 0}h
            </Text>

            <Text style={styles.badgeMeta}>
              Validée le {v.date_validation}
            </Text>

          </View>

        ))}

      </Page>

    </Document>
  );

  const buffer = await pdf(doc).toBuffer();

  return new NextResponse(buffer as any, {
    headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":`attachment; filename="Portfolio-${membre.nom}.pdf"`
    }
  });

}
