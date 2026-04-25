import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Variable serveur manquante dans Vercel." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const temporaryPassword = String(body.temporaryPassword || "").trim();

    if (!email || !temporaryPassword) {
      return NextResponse.json(
        { error: "Email et mot de passe temporaire requis." },
        { status: 400 }
      );
    }

    if (temporaryPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user: caller },
      error: callerError,
    } = await authClient.auth.getUser(token);

    if (callerError || !caller?.email) {
      return NextResponse.json(
        { error: "Session admin invalide." },
        { status: 401 }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: adminMembre, error: adminCheckError } = await adminClient
      .from("membres")
      .select("id, email, role, auth_id")
      .or(`auth_id.eq.${caller.id},email.eq.${caller.email}`)
      .eq("role", "admin")
      .maybeSingle();

    if (adminCheckError || !adminMembre) {
      return NextResponse.json(
        { error: "Accès réservé à l’admin." },
        { status: 403 }
      );
    }

    const { data: usersData, error: listError } =
      await adminClient.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const users = (usersData?.users ?? []) as Array<{
      id: string;
      email?: string | null;
    }>;

    const targetUser = users.find(
      (u) => (u.email ?? "").toLowerCase() === email
    );

    if (targetUser) {
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(targetUser.id, {
          password: temporaryPassword,
          email_confirm: true,
        });

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Mot de passe temporaire mis à jour.",
      });
    }

    const { error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec mot de passe temporaire.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur serveur inconnue." },
      { status: 500 }
    );
  }
}
