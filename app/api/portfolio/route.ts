import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData } = await supabase.auth.getUser(token);

  if (!userData.user) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const userId = userData.user.id;

  const { data: membre } = await supabase
    .from("membres")
    .select("id, nom, email")
    .eq("auth_id", userId)
    .maybeSingle();

  if (!membre) {
    return new NextResponse("Membre introuvable", { status: 404 });
  }

  const { data: validations } = await supabase
    .from("validations")
    .select("date_validation, formation:formations(titre, duree_heures)")
    .eq("membre_id", membre.id);

  let contenu = `Portfolio de ${membre.nom}\n\n`;

  validations?.forEach((v: any) => {
    contenu += `• ${v.formation.titre} (${v.formation.duree_heures}h) - ${v.date_validation}\n`;
  });

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="portfolio-${membre.nom}.txt"`,
    },
  });
}
