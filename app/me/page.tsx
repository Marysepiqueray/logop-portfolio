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

  // annuaire
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [presentation, setPresentation] = useState("");
  const [annuaireVisible, setAnnuaireVisible] = useState(false);
  const [permisConduire, setPermisConduire] = useState(false);
  const [statutConvention, setStatutConvention] = useState("");
  const [conventionVisible, setConventionVisible] = useState(false);

  // activités externes
  const [typeActivite, setTypeActivite] = useState("formation_externe");
  const [titreActivite, setTitreActivite] = useState("");
  const [organismeActivite, setOrganismeActivite] = useState("");
  const [dureeActivite, setDureeActivite] = useState<number>(2);
  const [domaineActivite, setDomaineActivite] = useState("");
  const [dateActivite, setDateActivite] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // souhaits
  const [souhaitDomaine, setSouhaitDomaine] = useState("");

  // langues
  const [languesReeducation, setLanguesReeducation] = useState<any[]>([]);
  const [languesSelectionnees, setLanguesSelectionnees] = useState<string[]>(
    []
  );

  // avis
  const [formationsValidees, setFormationsValidees] = useState<any[]>([]);
  const [formationAvis, setFormationAvis] = useState("");
  const [noteAvis, setNoteAvis] = useState(5);
  const [commentaireAvis, setCommentaireAvis] = useState("");
  const [avisParFormation, setAvisParFormation] = useState<Record<string, any>>(
    {}
  );

  // mot de passe
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

      let { data: m, error: mError } = await supabase
        .from("membres")
        .select("*")
        .ilike("email", email.trim())
        .eq("membre_asbl", true)
        .maybeSingle();

      if (mError) {
        alert(mError.message);
        window.location.href = "/";
        return;
      }

      if (!m) {
        alert(
          "Votre adresse email n'est pas reconnue comme membre actif de Logop'Aide et vous."
        );
        await supabase.auth.signOut();
        window.location.href = "/";
        return;
      }

      if (m.date_fin_adhesion) {
        const today = new Date().toISOString().slice(0, 10);

        if (m.date_fin_adhesion < today) {
          alert(
            "Votre adhésion à Logop'Aide et vous est expirée. Merci de contacter l'ASBL."
          );
          await supabase.auth.signOut();
          window.location.href = "/";
          return;
        }
      }

      if (!m.auth_id) {
        const { data: updated, error: updateError } = await supabase
          .from("membres")
          .update({ auth_id: userId })
          .eq("id", m.id)
          .select("*")
          .single();

        if (updateError) {
          alert(updateError.message);
          await supabase.auth.signOut();
          window.location.href = "/";
          return;
        }

        m = updated;
      }

      if (m.auth_id && m.auth_id !== userId) {
        alert("Ce membre est déjà lié à un autre compte.");
        await supabase.auth.signOut();
        window.location.href = "/";
        return;
      }

      const { data: d } = await supabase
        .from("domaines")
        .select("id, ordre, nom, description")
        .order("ordre", { ascending: true });

      const { data: v } = await supabase
        .from("validations")
        .select(
          "date_validation, formation:formations(id, titre, domaine_id, duree_heures, date_formation, date_fin_formation)"
        )
        .eq("membre_id", m.id)
        .order("date_validation", { ascending: false });

      const { data: a } = await supabase
        .from("activites")
        .select("*")
        .eq("membre_id", m.id)
        .order("created_at", { ascending: false });

      const { data: lr } = await supabase
        .from("langues_reeducation")
        .select("id, nom")
        .order("nom", { ascending: true });

      const { data: mlr } = await supabase
        .from("membre_langues_reeducation")
        .select("langue_id")
        .eq("membre_id", m.id);

      const { data: avis } = await supabase
        .from("avis_formations")
        .select("formation_id, note, commentaire, membre:membres(nom)")
        .order("created_at", { ascending: false });

      const avisMap: Record<string, any> = {};

      for (const a of (avis ?? []) as any[]) {
        const fid = a.formation_id;
        if (!fid) continue;

        if (!avisMap[fid]) {
          avisMap[fid] = {
            total: 0,
            count: 0,
            moyenne: 0,
            commentaires: [],
          };
        }

        avisMap[fid].total += Number(a.note ?? 0);
        avisMap[fid].count += 1;

        if (a.commentaire) {
          avisMap[fid].commentaires.push({
            nom: a.membre?.nom ?? "Membre",
            note: a.note,
            commentaire: a.commentaire,
          });
        }
      }

      for (const fid of Object.keys(avisMap)) {
        avisMap[fid].moyenne =
          avisMap[fid].count > 0 ? avisMap[fid].total / avisMap[fid].count : 0;
      }

      setMembre(m);
      setDomaines((d ?? []) as any);
      setValidations(v ?? []);
      setActivites(a ?? []);
      setFormationsValidees(
        (v ?? []).map((row: any) => row.formation).filter(Boolean)
      );

      setVille(m.ville ?? "");
      setCodePostal(m.code_postal ?? "");
      setPresentation(m.presentation ?? "");
      setAnnuaireVisible(m.annuaire_visible ?? false);
      setPermisConduire(m.permis_conduire ?? false);
      setStatutConvention(m.statut_convention ?? "");
      setConventionVisible(m.convention_visible ?? false);

      setLanguesReeducation(lr ?? []);
      setLanguesSelectionnees((mlr ?? []).map((x: any) => x.langue_id));
      setAvisParFormation(avisMap);

      setLoading(false);
    })();
  }, []);

  const passeport = useMemo(() => {
    const heures: Record<string, number> = {};

    for (const row of validations as any[]) {
      const formation = row.formation as any;
      const dom = formation?.domaine_id as string | undefined;
      if (!dom) continue;

      const h = Number(formation?.duree_heures ?? 0);
      heures[dom] = (heures[dom] ?? 0) + h;
    }

    for (const row of activites as any[]) {
      const dom = row.domaine_id as string | undefined;
      if (!dom) continue;

      const h = Number(row.duree_heures ?? 0);
      heures[dom] = (heures[dom] ?? 0) + h;
    }

    return domaines.map((d) => {
      const h = Number(heures[d.id] ?? 0);
      const med = medal(h);

      return {
        domaine: d,
        heures: h,
        medal: med,
      };
    });
  }, [domaines, validations, activites]);

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) {
      alert("Le nouveau mot de passe doit contenir au moins 6 caractères.");
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

  async function saveAnnuaire() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      alert("Utilisateur non connecté");
      return;
    }

    const { error } = await supabase
      .from("membres")
      .update({
        ville,
        code_postal: codePostal,
        presentation,
        annuaire_visible: annuaireVisible,
        permis_conduire: permisConduire,
        statut_convention: statutConvention,
        convention_visible: conventionVisible,
      })
      .eq("auth_id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profil annuaire enregistré");
  }

  async function addActivite() {
    if (!membre?.id) return alert("Membre introuvable");
    if (!titreActivite.trim()) return alert("Titre obligatoire");
    if (!domaineActivite) return alert("Choisir un domaine");

    if (dateActivite < "2016-01-01") {
      return alert("La date doit être au minimum le 01/01/2016");
    }

    const { error } = await supabase.from("activites").insert({
      membre_id: membre.id,
      titre: titreActivite.trim(),
      organisme: organismeActivite.trim() || null,
      date: dateActivite,
      duree_heures: Number(dureeActivite),
      domaine_id: domaineActivite,
      type: typeActivite,
      statut: "non_validee",
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: a } = await supabase
      .from("activites")
      .select("*")
      .eq("membre_id", membre.id)
      .order("created_at", { ascending: false });

    setActivites(a ?? []);

    setTitreActivite("");
    setOrganismeActivite("");
    setDureeActivite(2);
    setDomaineActivite("");
    setTypeActivite("formation_externe");
    setDateActivite(new Date().toISOString().slice(0, 10));

    alert("Activité ajoutée");
  }

  async function addSouhait() {
    if (!membre?.id) return;

    if (!souhaitDomaine) {
      alert("Choisir un domaine");
      return;
    }

    const { error } = await supabase.from("souhaits_formation").insert({
      membre_id: membre.id,
      domaine_id: souhaitDomaine,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Souhait enregistré");
    setSouhaitDomaine("");
  }

  async function saveLanguesReeducation() {
    if (!membre?.id) return alert("Membre introuvable");

    const { error: deleteError } = await supabase
      .from("membre_langues_reeducation")
      .delete()
      .eq("membre_id", membre.id);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    if (languesSelectionnees.length > 0) {
      const payload = languesSelectionnees.map((langueId) => ({
        membre_id: membre.id,
        langue_id: langueId,
      }));

      const { error: insertError } = await supabase
        .from("membre_langues_reeducation")
        .insert(payload);

      if (insertError) {
        alert(insertError.message);
        return;
      }
    }

    alert("Langues cliniques de rééducation enregistrées");
  }

  async function saveAvisFormation() {
    if (!membre?.id) return alert("Membre introuvable");
    if (!formationAvis) return alert("Choisir une formation");

    const { error } = await supabase
      .from("avis_formations")
      .upsert(
        {
          formation_id: formationAvis,
          membre_id: membre.id,
          note: Number(noteAvis),
          commentaire: commentaireAvis.trim() || null,
        },
        {
          onConflict: "formation_id,membre_id",
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    alert("Avis enregistré ✅");
    setFormationAvis("");
    setNoteAvis(5);
    setCommentaireAvis("");

    const { data: avis } = await supabase
      .from("avis_formations")
      .select("formation_id, note, commentaire, membre:membres(nom)")
      .order("created_at", { ascending: false });

    const avisMap: Record<string, any> = {};

    for (const a of (avis ?? []) as any[]) {
      const fid = a.formation_id;
      if (!fid) continue;

      if (!avisMap[fid]) {
        avisMap[fid] = {
          total: 0,
          count: 0,
          moyenne: 0,
          commentaires: [],
        };
      }

      avisMap[fid].total += Number(a.note ?? 0);
      avisMap[fid].count += 1;

      if (a.commentaire) {
        avisMap[fid].commentaires.push({
          nom: a.membre?.nom ?? "Membre",
          note: a.note,
          commentaire: a.commentaire,
        });
      }
    }

    for (const fid of Object.keys(avisMap)) {
      avisMap[fid].moyenne =
        avisMap[fid].count > 0 ? avisMap[fid].total / avisMap[fid].count : 0;
    }

    setAvisParFormation(avisMap);
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
      const txt = await res.text().catch(() => "");
      alert("Erreur génération PDF\n" + txt);
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
            <div
              key={p.domaine.id}
              className={`badge-tile ${
                p.medal.label.includes("Expert") ? "badge-expert" : ""
              }`}
            >
              <div className="badge-medal">
                {getDomaineIcon(p.domaine.nom)}
              </div>

              <div>
                <div className="badge-tile-title">{p.domaine.nom}</div>

                <div className="badge-tile-meta">{p.domaine.description}</div>

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

      <hr className="hr" />

      <h2>Ajouter une activité</h2>

      <p className="p">
        Vous pouvez ajouter vous-même une formation externe, une conférence ou
        un webinaire. Ces activités seront marquées comme{" "}
        <b>non validées par Logop’Aide et vous</b>.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <select
          className="input"
          value={typeActivite}
          onChange={(e) => setTypeActivite(e.target.value)}
        >
          <option value="formation_externe">Formation externe</option>
          <option value="conference">Conférence</option>
          <option value="webinaire">Webinaire</option>
        </select>

        <input
          className="input"
          value={titreActivite}
          onChange={(e) => setTitreActivite(e.target.value)}
          placeholder="Titre de l’activité"
        />

        <input
          className="input"
          value={organismeActivite}
          onChange={(e) => setOrganismeActivite(e.target.value)}
          placeholder="Organisme (optionnel)"
        />

        <div className="row">
          <input
            className="input"
            type="number"
            min="1"
            max="200"
            step="1"
            value={dureeActivite}
            onChange={(e) => setDureeActivite(Number(e.target.value))}
            placeholder="Durée (heures)"
          />

          <input
            className="input"
            type="date"
            min="2016-01-01"
            value={dateActivite}
            onChange={(e) => setDateActivite(e.target.value)}
          />
        </div>

        <select
          className="input"
          value={domaineActivite}
          onChange={(e) => setDomaineActivite(e.target.value)}
        >
          <option value="">Choisir un domaine</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>

        <button className="button" onClick={addActivite}>
          Ajouter l’activité
        </button>
      </div>

      <hr className="hr" />

      <h2>Domaines dans lesquels je souhaite me former</h2>

      <p className="p">
        Indiquez les domaines dans lesquels vous souhaiteriez suivre une
        formation. Ces informations permettent à Logop'Aide et vous d'organiser
        les prochaines formations.
      </p>

      <div className="row">
        <select
          className="input"
          value={souhaitDomaine}
          onChange={(e) => setSouhaitDomaine(e.target.value)}
        >
          <option value="">Choisir un domaine</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom}
            </option>
          ))}
        </select>

        <button className="button" onClick={addSouhait}>
          Ajouter
        </button>
      </div>

      <hr className="hr" />

      <h2>Mes activités ajoutées</h2>

      {activites.length === 0 ? (
        <p className="p">Aucune activité ajoutée pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {activites.map((a: any) => {
            const d = domaines.find((x) => x.id === a.domaine_id);

            return (
              <div key={a.id} className="small">
                <b>{a.titre}</b> — {a.duree_heures}h —{" "}
                {d?.nom ?? "Domaine non défini"} —{" "}
                <i>non validée par Logop’Aide et vous</i>
              </div>
            );
          })}
        </div>
      )}

      <hr className="hr" />

      <h2>Donner mon avis sur une formation suivie</h2>

      <p className="p">
        Vous pouvez attribuer une note de 1 à 5 étoiles et laisser un court
        commentaire pour aider les autres membres à choisir une formation.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <select
          className="input"
          value={formationAvis}
          onChange={(e) => setFormationAvis(e.target.value)}
        >
          <option value="">Choisir une formation suivie</option>
          {formationsValidees.map((f: any) => (
            <option key={f.id} value={f.id}>
              {f.titre}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={noteAvis}
          onChange={(e) => setNoteAvis(Number(e.target.value))}
        >
          <option value={5}>⭐⭐⭐⭐⭐ — 5</option>
          <option value={4}>⭐⭐⭐⭐ — 4</option>
          <option value={3}>⭐⭐⭐ — 3</option>
          <option value={2}>⭐⭐ — 2</option>
          <option value={1}>⭐ — 1</option>
        </select>

        <textarea
          className="input"
          placeholder="Votre commentaire (optionnel)"
          value={commentaireAvis}
          onChange={(e) => setCommentaireAvis(e.target.value)}
        />

        <button className="button" onClick={saveAvisFormation}>
          Enregistrer mon avis
        </button>
      </div>

      <hr className="hr" />

      <h2>Avis des membres sur les formations suivies</h2>

      {formationsValidees.length === 0 ? (
        <p className="p">Aucune formation suivie pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {formationsValidees.map((f: any) => {
            const avis = avisParFormation[f.id];
            const moyenne = avis?.moyenne ?? 0;
            const count = avis?.count ?? 0;
            const commentaires = avis?.commentaires ?? [];

            return (
              <div key={f.id} className="card" style={{ marginTop: 0 }}>
                <div className="badge-tile-title">{f.titre}</div>

                <div className="badge-tile-meta" style={{ marginBottom: 8 }}>
                  {count > 0 ? (
                    <>⭐ {moyenne.toFixed(1)} / 5 — {count} avis</>
                  ) : (
                    <>Pas encore d’avis</>
                  )}
                </div>

                {commentaires.length > 0 ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {commentaires.slice(0, 3).map((c: any, idx: number) => (
                      <div key={idx} className="small">
                        <b>{c.nom}</b> — {"⭐".repeat(Number(c.note))}
                        <br />
                        {c.commentaire}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small">Aucun commentaire pour le moment.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <hr className="hr" />

      <h2>Profil dans l’annuaire</h2>

      <p className="p">
        Choisissez si vous souhaitez apparaître dans l’annuaire des logopèdes.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 600 }}>
        <label className="small">Ville</label>

        <input
          className="input"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="Ex : Bruxelles"
        />

        <label className="small">Code postal</label>

        <input
          className="input"
          value={codePostal}
          onChange={(e) => setCodePostal(e.target.value)}
          placeholder="Ex : 4000"
        />

        <label className="small">Présentation</label>

        <textarea
          className="input"
          value={presentation}
          onChange={(e) => setPresentation(e.target.value)}
          placeholder="Décrivez brièvement votre pratique."
        />

        <label className="small">
          <input
            type="checkbox"
            checked={annuaireVisible}
            onChange={(e) => setAnnuaireVisible(e.target.checked)}
          />{" "}
          Apparaître dans l’annuaire
        </label>

        <label className="small">
          <input
            type="checkbox"
            checked={permisConduire}
            onChange={(e) => setPermisConduire(e.target.checked)}
          />{" "}
          Agréé.e permis de conduire
        </label>

        <label className="small">Statut de conventionnement</label>

        <select
          className="input"
          value={statutConvention}
          onChange={(e) => setStatutConvention(e.target.value)}
        >
          <option value="">Ne pas préciser</option>
          <option value="conventionne">Conventionné.e</option>
          <option value="deconventionne">Déconventionné.e</option>
        </select>

        <label className="small">
          <input
            type="checkbox"
            checked={conventionVisible}
            onChange={(e) => setConventionVisible(e.target.checked)}
          />{" "}
          Autoriser l’affichage public de ce statut dans l’annuaire
        </label>

        <label className="small">Langues cliniques de rééducation</label>

        <div style={{ display: "grid", gap: 6 }}>
          {languesReeducation.map((langue: any) => (
            <label key={langue.id} className="small">
              <input
                type="checkbox"
                checked={languesSelectionnees.includes(langue.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLanguesSelectionnees([
                      ...languesSelectionnees,
                      langue.id,
                    ]);
                  } else {
                    setLanguesSelectionnees(
                      languesSelectionnees.filter((id) => id !== langue.id)
                    );
                  }
                }}
              />{" "}
              {langue.nom}
            </label>
          ))}
        </div>

        <button className="button secondary" onClick={saveLanguesReeducation}>
          Enregistrer les langues
        </button>

        <button className="button" onClick={saveAnnuaire}>
          Enregistrer
        </button>
      </div>
    </main>
  );
}
