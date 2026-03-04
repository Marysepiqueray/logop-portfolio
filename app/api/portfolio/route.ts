import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const s = supabaseServer();

  const { data: userData } = await s.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const { data: membre } = await s
    .from("membres")
    .select("id, nom")
    .eq("auth_id", userId)
    .maybeSingle();

  if (!membre) {
    return new NextResponse("Membre introuvable", { status: 404 });
  }

  const { data: validations } = await s
    .from("validations")
    .select("date_validation, formation:formations(titre, duree_heures)")
    .eq("membre_id", membre.id);

  let contenu = `Portfolio de ${membre.nom}\n\n`;

  validations?.forEach((v) => {
    contenu += `• ${v.formation.titre} (${v.formation.duree_heures}h)\n`;
  });

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": "attachment; filename=portfolio.txt",
    },
  });
}
