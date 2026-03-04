import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const s = supabaseServer();

  const { data: userData } = await s.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) return new NextResponse("Not authenticated", { status: 401 });

  const { data: membre } = await s
    .from("membres")
    .select("id, nom, email")
    .eq("auth_id", userId)
    .maybeSingle();

  if (!membre) return new NextResponse("Membre introuvable", { status: 404 });

  const { data: vals, error } = await s
    .from("validations")
    .select("date_validation, formation:formations(titre, duree_heures, niveau)")
    .eq("membre_id", membre.id)
    .order("date_validation", { ascending: false });

  if (error) return new NextResponse(error.message, { status: 500 });

  const lines: string[] = [];
  lines.push(`Portfolio – ${membre.nom}`);
  lines.push(`Email : ${membre.email}`);
  lines.push("");
  lines.push(`Formations validées : ${vals?.length ?? 0}`);
  lines.push("");

  (vals ?? []).forEach((v: any) => {
    lines.push(`• ${v.formation?.titre ?? "Formation"} — ${v.formation?.duree_heures ?? 0}h — ${v.date_validation}`);
  });

  const contenu = lines.join("\n");

  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="Portfolio-${membre.nom}.txt"`,
    },
  });
}
