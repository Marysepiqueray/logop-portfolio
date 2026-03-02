"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Membre = { id: string; nom: string; email: string; role: "admin" | "membre" };
type ValidationRow = {
  date_validation: string;
  formation: { titre: string; competences: string; duree_heures: number; niveau: string };
};

export default function MePage() {
  const [loading, setLoading] = useState(true);
  const [membre, setMembre] = useState<Membre | null>(null);
  const [validations, setValidations] = useState<ValidationRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        window.location.href = "/";
        return;
      }

      const { data: m, error: mErr } = await supabase
        .from("membres")
        .select("id, nom, email, role")
        .eq("auth_id", userId)
        .maybeSingle();

      if (mErr || !m) {
        alert("Accès non autorisé : votre compte n’est pas lié à un membre.");
        await supabase.auth.signOut();
        window.location.href = "/";
        return;
      }

      setMembre(m);

      const { data: v, error: vErr } = await supabase
        .from("validations")
        .select("date_validation, formation:formations(titre, competences, duree_heures, niveau)")
        .order("date_validation", { ascending: false });

      if (vErr) alert(vErr.message);
      setValidations((v ?? []) as any);

      setLoading(false);
    })();
  }, []);

  const totalHeures = useMemo(() => {
    return validations.reduce((sum, v) => sum + Number(v.formation?.duree_heures ?? 0), 0);
  }, [validations]);

  async function downloadPdf() {
    const res = await fetch("/api/portfolio");
    if (!res.ok) {
      alert("Impossible de générer le PDF.");
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Portfolio-${membre?.nom ?? "membre"}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) return <p>Chargement…</p>;

  return (
    <main>
      <h1>Mon portfolio</h1>

      <p>
        Membre : <b>{membre?.nom}</b> — {membre?.email}
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0" }}>
        <div>
          <b>Formations validées :</b> {validations.length}
        </div>
        <div>
          <b>Total heures :</b> {totalHeures}
        </div>
      </div>

      <button onClick={downloadPdf} style={{ padding: "10px 14px" }}>
        Télécharger mon portfolio PDF
      </button>

      <h2 style={{ marginTop: 24 }}>Formations</h2>

      {validations.length === 0 ? (
        <p>Aucune formation validée pour le moment.</p>
      ) : (
        <ul>
          {validations.map((v, idx) => (
            <li key={idx} style={{ marginBottom: 10 }}>
              <b>{v.formation.titre}</b> — validée le {v.date_validation}
              <div style={{ fontSize: 14 }}>
                Durée : {v.formation.duree_heures ?? 0}h • Niveau : {v.formation.niveau || "—"}
                <br />
                Compétences : {v.formation.competences || "—"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
