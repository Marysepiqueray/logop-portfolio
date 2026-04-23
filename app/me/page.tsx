"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = {
  id: string;
  ordre: number;
  nom: string;
  description: string;
};

function medal(hours: number) {
  if (hours >= 120) return { label: "Expert Logop'Aide et vous", icon: "🏆" };
  if (hours >= 90) return { label: "OR", icon: "🥇" };
  if (hours >= 45) return { label: "ARGENT", icon: "🥈" };
  if (hours >= 15) return { label: "BRONZE", icon: "🥉" };
  return { label: "AUCUN", icon: "⬜" };
}

function getDomaineIcon(nom: string) {
  const text = (nom || "").toLowerCase();

  if (text.includes("langage oral")) return "🗣️";
  if (text.includes("langage écrit")) return "📖";
  if (text.includes("neurolog")) return "🧠";
  if (text.includes("moteurs")) return "👄";
  if (text.includes("fluence")) return "💬";
  if (text.includes("voix")) return "🎤";
  if (text.includes("oro")) return "🦷";
  if (text.includes("déglutition")) return "🥄";
  if (text.includes("autres")) return "✨";

  return "🏅";
}

export default function MePage() {
  const [loading, setLoading] = useState(true);

  const [membre, setMembre] = useState<any>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [activites, setActivites] = useState<any[]>([]);

  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [presentation, setPresentation] = useState("");
  const [annuaireVisible, setAnnuaireVisible] = useState(false);
  const [permisConduire, setPermisConduire] = useState(false);
  const [statutConvention, setStatutConvention] = useState("");
  const [conventionVisible, setConventionVisible] = useState(false);

  const [typeActivite, setTypeActivite] = useState("formation_externe");
  const [titreActivite, setTitreActivite] = useState("");
  const [organismeActivite, setOrganismeActivite] = useState("");
  const [dureeActivite, setDureeActivite] = useState<number>(2);
  const [domaineActivite, setDomaineActivite] = useState("");
  const [dateActivite, setDateActivite] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [souhaitDomaine, setSouhaitDomaine] = useState("");

  const [languesReeducation, setLanguesReeducation] = useState<any[]>([]);
  const [languesSelectionnees, setLanguesSelectionnees] = useState<string[]>(
    []
  );

  const [formationsValidees, setFormationsValidees] = useState<any[]>([]);
  const [formationAvis, setFormationAvis] = useState("");
  const [noteAvis, setNoteAvis] = useState(5);
  const [commentaireAvis, setCommentaireAvis] = useState("");
  const [avisParFormation, setAvisParFormation] = useState<Record<string, any>>(
    {}
  );

  // nouveau mot de passe
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      const userId = user?.id;
      const email = user?.email?.toLowerCase().trim();

      if (!userId || !email) {
        window.location.href = "/";
        return;
      }

      let { data: m } = await supabase
        .from("membres")
        .select("*")
        .ilike("email", email)
        .eq("membre_asbl", true)
        .maybeSingle();

      if (!m) {
        await supabase.auth.signOut();
        window.location.href = "/";
        return;
      }

      if (!m.auth_id) {
        const { data: updated } = await supabase
          .from("membres")
          .update({ auth_id: userId })
          .eq("id", m.id)
          .select("*")
          .single();

        m = updated;
      }

      const { data: d } = await supabase
        .from("domaines")
        .select("id, ordre, nom, description")
        .order("ordre", { ascending: true });

      const { data: v } = await supabase
        .from("validations")
        .select(
          "date_validation, formation:formations(id, titre, domaine_id, duree_heures)"
        )
        .eq("membre_id", m.id);

      const { data: a } = await supabase
        .from("activites")
        .select("*")
        .eq("membre_id", m.id);

      const { data: lr } = await supabase
        .from("langues_reeducation")
        .select("id, nom")
        .order("nom", { ascending: true });

      const { data: mlr } = await supabase
        .from("membre_langues_reeducation")
        .select("langue_id")
        .eq("membre_id", m.id);

      setMembre(m);
      setDomaines((d ?? []) as any);
      setValidations(v ?? []);
      setActivites(a ?? []);
      setLanguesReeducation(lr ?? []);
      setLanguesSelectionnees((mlr ?? []).map((x: any) => x.langue_id));

      setVille(m.ville ?? "");
      setCodePostal(m.code_postal ?? "");
      setPresentation(m.presentation ?? "");
      setAnnuaireVisible(m.annuaire_visible ?? false);
      setPermisConduire(m.permis_conduire ?? false);
      setStatutConvention(m.statut_convention ?? "");
      setConventionVisible(m.convention_visible ?? false);

      setFormationsValidees(
        (v ?? []).map((row: any) => row.formation).filter(Boolean)
      );

      setLoading(false);
    })();
  }, []);

  const passeport = useMemo(() => {
    const heures: Record<string, number> = {};

    for (const row of validations as any[]) {
      const formation = row.formation as any;
      const dom = formation?.domaine_id;
      if (!dom) continue;

      heures[dom] =
        (heures[dom] ?? 0) + Number(formation?.duree_heures ?? 0);
    }

    for (const row of activites as any[]) {
      const dom = row.domaine_id;
      if (!dom) continue;

      heures[dom] = (heures[dom] ?? 0) + Number(row.duree_heures ?? 0);
    }

    return domaines.map((d) => {
      const h = Number(heures[d.id] ?? 0);

      return {
        domaine: d,
        heures: h,
        medal: medal(h),
      };
    });
  }, [domaines, validations, activites]);

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) {
      alert("Minimum 6 caractères.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewPassword("");
    alert("Mot de passe modifié ✅");
  }

  async function generatePDF() {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const res = await fetch("/api/portfolio", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      alert("Erreur PDF");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.pdf";
    a.click();
  }

  if (loading) {
    return <main className="card">Chargement…</main>;
  }

  return (
    <main className="card">
      <h1 className="h1">Mon portfolio</h1>

      <hr className="hr" />

      <h2>Changer mon mot de passe</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 500 }}>
        <input
          className="input"
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button className="button secondary" onClick={changePassword}>
          Enregistrer le nouveau mot de passe
        </button>
      </div>

      <hr className="hr" />

      <div className="row">
        <button className="button" onClick={generatePDF}>
          Télécharger le portfolio PDF
        </button>
      </div>

      <hr className="hr" />

      <h2>Mes domaines</h2>

      <div className="badge-grid">
        {passeport.map((p: any) => {
          const pct = Math.min(100, (p.heures / 90) * 100);

          return (
            <div key={p.domaine.id} className="badge-tile">
              <div className="badge-medal">
                {getDomaineIcon(p.domaine.nom)}
              </div>

              <div>
                <div className="badge-tile-title">{p.domaine.nom}</div>

                <div className="badge-tile-meta">
                  {p.medal.icon} {p.medal.label} — {p.heures}h
                </div>

                <div className="progress">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
