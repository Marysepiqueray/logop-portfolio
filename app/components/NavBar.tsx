"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NavBar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) return;

      const { data: membre } = await supabase
        .from("membres")
        .select("role")
        .eq("auth_id", userId)
        .maybeSingle();

      if (membre?.role === "admin") {
        setIsAdmin(true);
      }
    }

    checkRole();
  }, []);

  return (
    <nav className="navbar">
      <a href="/">Accueil</a>
      <a href="/me">Mon portfolio</a>
      <a href="/annuaire">Annuaire</a>
      <a href="/carte">Carte</a>

      <a
        href="https://www.logopaidetvous.be/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Site ASBL
      </a>

      {isAdmin && <a href="/admin">Admin</a>}
    </nav>
  );
}
