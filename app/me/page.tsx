"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const labels = {
  fr: {
    loading: "Chargement…",
    title: "Mon portfolio",
    changePassword: "Changer mon mot de passe",
    newPassword: "Nouveau mot de passe",
    savePassword: "Enregistrer le nouveau mot de passe",
    downloadPdf: "Télécharger le portfolio PDF",
    myDomains: "Mes domaines",
    addActivity: "Ajouter une activité",
    activityText:
      "Vous pouvez ajouter vous-même une formation externe, une conférence ou un webinaire. Ces activités seront marquées comme non validées par Logop’Aide et vous.",
    activityTitle: "Titre de l’activité",
    organisation: "Organisme (optionnel)",
    duration: "Durée (heures)",
    chooseDomain: "Choisir un domaine",
    add: "Ajouter",
    publishQuestion: "Publier la question",
    close: "Fermer",
    description: "Description",
    goals: "Objectifs / compétences",
    giveReview: "Donner mon avis sur une formation suivie",
reviewText:
  "Vous pouvez attribuer une note de 1 à 5 étoiles et laisser un commentaire pour aider les autres membres.",
chooseTraining: "Choisir une formation suivie",
    comment: "Votre commentaire (optionnel)",
    saveReview: "Enregistrer mon avis",
    memberReviews: "Avis des membres sur les formations suivies",
    noTrainingYet: "Aucune formation suivie pour le moment",
    noReviews: "Pas encore d’avis",
    directoryProfile: "Profil dans l’annuaire",
city: "Ville",
postalCode: "Code postal",
presentation: "Présentation",
showInDirectory: "Apparaître dans l’annuaire",
drivingLicense: "Agréé.e permis de conduire",
conventionStatus: "Statut de conventionnement",
noSpecify: "Ne pas préciser",
allowPublic: "Autoriser l’affichage public de ce statut dans l’annuaire",
languages: "Langues cliniques de rééducation",
saveLanguages: "Enregistrer les langues",
save: "Enregistrer",
clinicalQuestions: "Questions cliniques",
clinicalIntro: "Posez vos questions au réseau et échangez entre logopèdes.",
askQuestion: "Poser une question",
questionTitle: "Titre de la question",
questionText: "Décrivez votre question clinique",
    directoryIntro:
  "Choisissez si vous souhaitez apparaître dans l’annuaire des logopèdes.",
  presentationPlaceholder: "Décrivez brièvement votre pratique.",
    trainingWishTitle: "Domaines dans lesquels je souhaite me former",
trainingWishText:
  "Indiquez les domaines dans lesquels vous souhaiteriez suivre une formation. Ces informations permettent à Logop'Aide et vous d'organiser les prochaines formations.",
    myActivities: "Mes activités ajoutées",
noActivities: "Aucune activité ajoutée pour le moment.",
notValidated: "non validée par Logop’Aide et vous",
    externalTraining: "Formation externe",
conference: "Conférence",
webinar: "Webinaire",
    formalActivities: "Activités formelles",
autonomousActivities: "Activités autonomes",
transmissionActivities: "Transmission / cours donnés",
scientificActivities: "Travaux scientifiques",
undefinedDomain: "Domaine non défini",
viewLink: "Voir le lien",
    lecture: "Lecture professionnelle",
article: "Article scientifique",
book: "Livre",
podcast: "Podcast",
tfe: "TFE / mémoire",
publication: "Publication",
courseGiven: "Cours donné",
supervision: "Supervision",
innovationAI: "Approches innovantes, outils numériques et IA",
optionalLink: "Lien (optionnel)",
personalReflection: "Description / réflexion personnelle",
optionalDuration: "Durée facultative",
    copyInami: "Copier résumé INAMI / ProSanté",
inamiCopied:
  "Résumé copié dans le presse-papiers ✅ Vous pouvez maintenant le coller dans un document, un email ou le portail INAMI / ProSanté.",
    copyLinkedin: "Copier résumé LinkedIn",
linkedinCopied:
  "Résumé LinkedIn copié dans le presse-papiers ✅ Vous pouvez maintenant le coller sur LinkedIn.",
  },
  nl: {
    loading: "Laden…",
    title: "Mijn portfolio",
    changePassword: "Mijn wachtwoord wijzigen",
    newPassword: "Nieuw wachtwoord",
    savePassword: "Nieuw wachtwoord opslaan",
    downloadPdf: "Portfolio als PDF downloaden",
    myDomains: "Mijn domeinen",
    addActivity: "Activiteit toevoegen",
    activityText:
      "U kunt zelf een externe opleiding, conferentie of webinar toevoegen. Deze activiteiten worden gemarkeerd als niet gevalideerd door Logop’Aide et vous.",
    activityTitle: "Titel van de activiteit",
    organisation: "Organisatie (optioneel)",
    duration: "Duur (uren)",
    chooseDomain: "Domein kiezen",
    add: "Toevoegen",
    save: "Opslaan",
      saveLanguages: "Talen opslaan",
    clinicalQuestions: "Klinische vragen",
    clinicalIntro: "Stel uw vragen aan het netwerk en wissel uit.",
    askQuestion: "Een vraag stellen",
    questionTitle: "Titel van de vraag",
    questionText: "Beschrijf uw klinische vraag",
    close: "Sluiten",
    description: "Beschrijving",
    goals: "Doelen / competenties",
    giveReview: "Mijn mening over een opleiding",
reviewText:
  "Geef een score van 1 tot 5 sterren en een korte reactie om anderen te helpen.",
chooseTraining: "Kies een gevolgde opleiding",
    comment: "Uw commentaar (optioneel)",
    saveReview: "Mijn beoordeling opslaan",
    memberReviews: "Beoordelingen van leden over gevolgde opleidingen",
    noTrainingYet: "Nog geen gevolgde opleiding",
    noReviews: "Nog geen beoordelingen",
    directoryProfile: "Profiel in de gids",
city: "Stad",
postalCode: "Postcode",
presentation: "Voorstelling",
showInDirectory: "Weergeven in de gids",
drivingLicense: "Erkend rijgeschiktheid",
conventionStatus: "Conventiestatus",
noSpecify: "Niet specificeren",
allowPublic: "Publieke weergave toestaan",
languages: "Klinische revalidatietalen",
publishQuestion: "Vraag publiceren",
    directoryIntro:
  "Kies of u zichtbaar wilt zijn in de logopedistenlijst.",
  presentationPlaceholder: "Beschrijf kort uw praktijk.",
    trainingWishTitle: "Domeinen waarin ik mij wil bijscholen",
trainingWishText:
  "Geef aan in welke domeinen u een opleiding wilt volgen. Deze informatie helpt bij het organiseren van toekomstige opleidingen.",
    myActivities: "Mijn toegevoegde activiteiten",
noActivities: "Nog geen activiteiten toegevoegd.",
notValidated: "niet gevalideerd door Logop’Aide et vous",
    externalTraining: "Externe opleiding",
conference: "Conferentie",
webinar: "Webinar",
    formalActivities: "Formele activiteiten",
autonomousActivities: "Autonome activiteiten",
transmissionActivities: "Overdracht / gegeven lessen",
scientificActivities: "Wetenschappelijke werken",
undefinedDomain: "Domein niet gedefinieerd",
viewLink: "Link bekijken",
    lecture: "Professionele lectuur",
article: "Wetenschappelijk artikel",
book: "Boek",
podcast: "Podcast",
tfe: "Eindwerk / scriptie",
publication: "Publicatie",
courseGiven: "Gegeven cursus",
supervision: "Supervisie",
innovationAI: "Innovatieve benaderingen, digitale tools en AI",
optionalLink: "Link (optioneel)",
personalReflection: "Beschrijving / persoonlijke reflectie",
optionalDuration: "Optionele duur",
    copyInami: "INAMI / ProSanté-samenvatting kopiëren",
inamiCopied:
  "Samenvatting gekopieerd naar het klembord ✅ U kunt deze nu plakken in een document, e-mail of het INAMI / ProSanté-portaal.",
    copyLinkedin: "LinkedIn-samenvatting kopiëren",
linkedinCopied:
  "LinkedIn-samenvatting gekopieerd naar het klembord ✅ U kunt deze nu op LinkedIn plakken.",
  },
  de: {
    loading: "Wird geladen…",
    title: "Mein Portfolio",
    changePassword: "Mein Passwort ändern",
    newPassword: "Neues Passwort",
    savePassword: "Neues Passwort speichern",
    downloadPdf: "Portfolio als PDF herunterladen",
    myDomains: "Meine Bereiche",
    addActivity: "Aktivität hinzufügen",
    activityText:
      "Sie können selbst eine externe Fortbildung, Konferenz oder ein Webinar hinzufügen. Diese Aktivitäten werden als nicht von Logop’Aide et vous validiert markiert.",
    activityTitle: "Titel der Aktivität",
    organisation: "Organisation (optional)",
    duration: "Dauer (Stunden)",
    close: "Schließen",
    description: "Beschreibung",
    goals: "Ziele / Kompetenzen",
    giveReview: "Meine Bewertung einer Fortbildung",
reviewText:
  "Geben Sie eine Bewertung von 1 bis 5 Sternen und einen Kommentar ab.",
chooseTraining: "Fortbildung auswählen",
    comment: "Ihr Kommentar (optional)",
    saveReview: "Bewertung speichern",
    memberReviews: "Bewertungen der Mitglieder zu absolvierten Fortbildungen",
    noTrainingYet: "Noch keine absolvierte Fortbildung",
    noReviews: "Noch keine Bewertungen",
    directoryProfile: "Profil im Verzeichnis",
city: "Stadt",
postalCode: "Postleitzahl",
presentation: "Vorstellung",
showInDirectory: "Im Verzeichnis anzeigen",
drivingLicense: "Anerkannt für Fahreignung",
conventionStatus: "Konventionsstatus",
noSpecify: "Nicht angeben",
allowPublic: "Öffentliche Anzeige erlauben",
languages: "Klinische Rehabilitationssprachen",
saveLanguages: "Sprachen speichern",
save: "Speichern",

clinicalQuestions: "Klinische Fragen",
clinicalIntro: "Stellen Sie Fragen an das Netzwerk.",
askQuestion: "Frage stellen",
chooseDomain: "Bereich wählen",
questionTitle: "Fragetitel",
questionText: "Beschreiben Sie Ihre klinische Frage",
publishQuestion: "Frage veröffentlichen",
    directoryIntro:
  "Wählen Sie, ob Sie im Verzeichnis erscheinen möchten.",
  presentationPlaceholder: "Beschreiben Sie kurz Ihre Praxis.",
    trainingWishTitle: "Bereiche, in denen ich mich weiterbilden möchte",
trainingWishText:
  "Geben Sie an, in welchen Bereichen Sie eine Fortbildung machen möchten. Diese Informationen helfen bei der Organisation zukünftiger Schulungen.",
    myActivities: "Meine hinzugefügten Aktivitäten",
noActivities: "Noch keine Aktivitäten hinzugefügt.",
notValidated: "nicht validiert durch Logop’Aide et vous",
    add: "Hinzufügen",
    externalTraining: "Externe Fortbildung",
conference: "Konferenz",
webinar: "Webinar",
    formalActivities: "Formelle Aktivitäten",
autonomousActivities: "Selbstständige Aktivitäten",
transmissionActivities: "Vermittlung / gehaltene Kurse",
scientificActivities: "Wissenschaftliche Arbeiten",
undefinedDomain: "Bereich nicht definiert",
viewLink: "Link ansehen",
    lecture: "Fachlektüre",
article: "Wissenschaftlicher Artikel",
book: "Buch",
podcast: "Podcast",
tfe: "Abschlussarbeit",
publication: "Veröffentlichung",
courseGiven: "Gehaltener Kurs",
supervision: "Supervision",
innovationAI: "Innovative Ansätze, digitale Werkzeuge und KI",
optionalLink: "Link (optional)",
personalReflection: "Beschreibung / persönliche Reflexion",
optionalDuration: "Optionale Dauer",
    copyInami: "INAMI / ProSanté-Zusammenfassung kopieren",
inamiCopied:
  "Zusammenfassung in die Zwischenablage kopiert ✅ Sie können sie jetzt in ein Dokument, eine E-Mail oder das INAMI / ProSanté-Portal einfügen.",
    copyLinkedin: "LinkedIn-Zusammenfassung kopieren",
linkedinCopied:
  "LinkedIn-Zusammenfassung in die Zwischenablage kopiert ✅ Sie können sie jetzt auf LinkedIn einfügen.",
  },
};

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
  const [lang, setLang] = useState<"fr" | "nl" | "de">("fr");

  const [membre, setMembre] = useState<any>(null);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [activites, setActivites] = useState<any[]>([]);
  const [formationDetail, setFormationDetail] = useState<any>(null);

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
const [descriptionActivite, setDescriptionActivite] = useState("");
const [lienActivite, setLienActivite] = useState("");
  const [titreActivite, setTitreActivite] = useState("");
  const [organismeActivite, setOrganismeActivite] = useState("");
  const [dureeActivite, setDureeActivite] = useState<number>(2);
  const [domaineActivite, setDomaineActivite] = useState("");
  const [dateActivite, setDateActivite] = useState(
    const [dateFinActivite, setDateFinActivite] = useState("");
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
  const [copied, setCopied] = useState(false);
const [linkedinCopied, setLinkedinCopied] = useState(false);

  // questions cliniques
  const [questionsCliniques, setQuestionsCliniques] = useState<any[]>([]);
  const [questionDomaine, setQuestionDomaine] = useState("");
  const [questionTitre, setQuestionTitre] = useState("");
  const [questionTexte, setQuestionTexte] = useState("");

  useEffect(() => {
    (async () => {
      const savedLang = localStorage.getItem("lang") as "fr" | "nl" | "de" | null;
if (savedLang === "fr" || savedLang === "nl" || savedLang === "de") {
  setLang(savedLang);
}
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
        .ilike("email", email)
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
        .select("id, ordre, nom, description, nom_nl, nom_de, description_nl, description_de")
        .order("ordre", { ascending: true });

const { data: v } = await supabase
  .from("validations")
  .select(
    "date_validation, formation:formations(id, titre, domaine_id, duree_heures, date_formation, date_fin_formation, description, competences)"
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
       .select("id, nom, nom_nl, nom_de")
        .order("nom", { ascending: true });

      const { data: mlr } = await supabase
        .from("membre_langues_reeducation")
       .select("id, nom, nom_nl, nom_de")
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

      const { data: qc } = await supabase
        .from("questions_cliniques")
        .select("*")
        .order("created_at", { ascending: false });

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
      setQuestionsCliniques(qc ?? []);

      setLoading(false);
    })();
  }, []);
  
function getText(d: any, field: "nom" | "description", lang: string) {
  if (lang === "nl") return d[`${field}_nl`] || d[field];
  if (lang === "de") return d[`${field}_de`] || d[field];
  return d[field];
}
  
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
function getCategorieFromType(type: string) {
  if (["lecture", "article", "livre", "podcast", "innovation_ia"].includes(type)) {
    return "autonome";
  }

  if (["cours_donne", "supervision"].includes(type)) {
    return "transmission";
  }

  if (["tfe", "publication"].includes(type)) {
    return "scientifique";
  }

  return "formelle";
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

      categorie: getCategorieFromType(typeActivite),
description: descriptionActivite.trim() || null,
lien: lienActivite.trim() || null,
      
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
setDescriptionActivite("");
setLienActivite("");

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

  async function publierQuestionClinique() {
    if (!membre?.id) return alert("Membre introuvable");
    if (!questionDomaine) return alert("Choisir un domaine");
    if (!questionTitre.trim()) return alert("Titre obligatoire");
    if (!questionTexte.trim()) return alert("Question obligatoire");

    const { error } = await supabase.from("questions_cliniques").insert({
      membre_id: membre.id,
      domaine_id: questionDomaine,
      titre: questionTitre.trim(),
      question: questionTexte.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: qc } = await supabase
      .from("questions_cliniques")
      .select("*")
      .order("created_at", { ascending: false });

    setQuestionsCliniques(qc ?? []);
    setQuestionDomaine("");
    setQuestionTitre("");
    setQuestionTexte("");

    alert("Question publiée ✅");
  }

async function copyInamiSummary() {
 const formationsTexte = validations
  .map((v: any) => {
    const f = v.formation;

    return `• ${f?.titre ?? "Formation"}${
      f?.duree_heures ? ` — ${f.duree_heures}h` : ""
    }${
      f?.date_formation ? ` — ${f.date_formation}` : ""
    }`;
  })
  .join("\n");

const activitesTexte = activites
  .map((a: any) => {
    return `• ${a.titre}${
      a.duree_heures ? ` — ${a.duree_heures}h` : ""
    }${
      a.date ? ` — ${a.date}` : ""
    }`;
  })
  .join("\n");

const texte = `Portfolio professionnel — Synthèse INAMI / ProSanté

Nom : ${membre?.nom ?? ""}
Email : ${membre?.email ?? ""}

FORMATIONS VALIDÉES
${formationsTexte || "Aucune formation"}

AUTRES ACTIVITÉS
${activitesTexte || "Aucune activité"}

Total :
${validations.length} formations
${activites.length} activités
`;


  await navigator.clipboard.writeText(texte);

  setCopied(true);
  setTimeout(() => setCopied(false), 2500);
}

async function copyLinkedinSummary() {
  const topDomaines = passeport
    .filter((p: any) => p.heures > 0)
    .sort((a: any, b: any) => b.heures - a.heures)
    .slice(0, 3)
    .map((p: any) => getText(p.domaine, "nom", lang));

  const texte = `Logopède engagée dans une démarche de formation continue.

Domaines principaux :
${topDomaines.map((d: string) => `• ${d}`).join("\n")}

Portfolio professionnel incluant formations, activités autonomes, transmission et travaux scientifiques.

#logopédie #formationcontinue #santé`;

  await navigator.clipboard.writeText(texte);

  setLinkedinCopied(true);
  setTimeout(() => setLinkedinCopied(false), 3000);
}

async function generatePDF() {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;

  const res = await fetch(`/api/portfolio?lang=${lang}`, {
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
  
const t = labels[lang];
  
  return (
    <main className="card">
   <h1 className="h1">{t.title}</h1>

      <hr className="hr" />

    <h2>{t.changePassword}</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 500 }}>
        <input
          className="input"
          type="password"
         placeholder={t.newPassword}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button className="button secondary" onClick={changePassword}>
          {t.savePassword}
        </button>
      </div>

      <hr className="hr" />

      <div className="row">
        <button className="button" onClick={generatePDF}>
         {t.downloadPdf}
        </button>
        <button className="button secondary" onClick={copyInamiSummary}>
  {t.copyInami}
</button>
        
<button className="button secondary" onClick={copyLinkedinSummary}>
  {t.copyLinkedin}
</button>
        {copied ? (
  <div className="small" style={{ color: "#16a34a", marginTop: 8 }}>
    ✅ {t.inamiCopied}
  </div>
) : null}

{linkedinCopied ? (
  <div className="small" style={{ color: "#16a34a", marginTop: 8 }}>
    ✅ {t.linkedinCopied}
  </div>
) : null}

      </div>

      <hr className="hr" />

      <h2>{t.myDomains}</h2>

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
              <div className="badge-tile-title">
  {getText(p.domaine, "nom", lang)}
</div>

                <div className="badge-tile-meta">{getText(p.domaine, "description", lang)}</div>

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

      <h2>{t.addActivity}</h2>

<p className="p">{t.activityText}</p>

<div style={{ display: "grid", gap: 10, maxWidth: 700 }}>

  <select
    className="input"
    value={typeActivite}
    onChange={(e) => setTypeActivite(e.target.value)}
  >
    <option value="formation_externe">{t.externalTraining}</option>
<option value="conference">{t.conference}</option>
<option value="webinaire">{t.webinar}</option>
<option value="lecture">{t.lecture}</option>
<option value="article">{t.article}</option>
<option value="livre">{t.book}</option>
<option value="podcast">{t.podcast}</option>
<option value="tfe">{t.tfe}</option>
<option value="publication">{t.publication}</option>
<option value="cours_donne">{t.courseGiven}</option>
<option value="supervision">{t.supervision}</option>
<option value="innovation_ia">{t.innovationAI}</option>
  </select>

        <input
          className="input"
          value={titreActivite}
          onChange={(e) => setTitreActivite(e.target.value)}
          placeholder={t.activityTitle}
        />
  
       <input
  className="input"
  value={organismeActivite}
  onChange={(e) => setOrganismeActivite(e.target.value)}
  placeholder={t.organisation}
/>

<textarea
  className="input"
  value={descriptionActivite}
  onChange={(e) => setDescriptionActivite(e.target.value)}
 placeholder={t.personalReflection}
/>

<input
  className="input"
  value={lienActivite}
  onChange={(e) => setLienActivite(e.target.value)}
  placeholder={t.optionalLink}
/>

        <div className="row">
          <input
            className="input"
            type="number"
            min="1"
            max="200"
            step="0.5"
            value={dureeActivite}
            onChange={(e) => setDureeActivite(Number(e.target.value))}
          placeholder={
  ["lecture", "article", "livre", "podcast", "innovation_ia"].includes(typeActivite)
    ? t.optionalDuration
    : t.duration
}
          />

          <input
            className="input"
            type="date"
            min="2016-01-01"
            value={dateActivite} 
            onChange={(e) => setDateActivite(e.target.value)}
          />
            <input
  className="input"
  type="date"
  min="2016-01-01"
  value={dateFinActivite}
  onChange={(e) => setDateFinActivite(e.target.value)}
/>
           
        </div>

        <select
          className="input"
          value={domaineActivite}
          onChange={(e) => setDomaineActivite(e.target.value)}
        >
         <option value="">{t.chooseDomain}</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>
  {getText(d, "nom", lang)}
</option>
          ))}
        </select>

        <button className="button" onClick={addActivite}>
          {t.addActivity}
        </button>
      </div>

      <hr className="hr" />

      <h2>{t.trainingWishTitle}</h2>

     <p className="p">{t.trainingWishText}</p>

      <div className="row">
        <select
          className="input"
          value={souhaitDomaine}
          onChange={(e) => setSouhaitDomaine(e.target.value)}
        ><option value="">{t.chooseDomain}</option>
          {domaines.map((d) => (
            <option key={d.id} value={d.id}>
             {getText(d, "nom", lang)}
            </option>
          ))}
        </select>

        <button className="button" onClick={addSouhait}>
  {t.add}
</button>
      </div>

      <hr className="hr" />

    <h2>{t.myActivities}</h2>

{activites.length === 0 ? (
  <p className="p">{t.noActivities}</p>
) : (
  <div style={{ display: "grid", gap: 18 }}>
    {[
  ["formelle", t.formalActivities],
  ["autonome", t.autonomousActivities],
  ["transmission", t.transmissionActivities],
  ["scientifique", t.scientificActivities],
].map(([categorie, titre]) => {
      const items = activites.filter(
        (a: any) => (a.categorie ?? "formelle") === categorie
      );

      if (items.length === 0) return null;

      return (
        <div key={categorie}>
          <h3 style={{ marginBottom: 8 }}>{titre}</h3>

          <div style={{ display: "grid", gap: 8 }}>
            {items.map((a: any) => {
              const d = domaines.find((x) => x.id === a.domaine_id);

              return (
                <div key={a.id} className="small">
                  <b>{a.titre}</b>
                  {a.duree_heures ? <> — {a.duree_heures}h</> : null}
                  {" — "}
                  {d ? getText(d, "nom", lang) : "t.undefinedDomain"}{" "}
                  — <i>{t.notValidated}</i>

                  {a.description ? (
                    <>
                      <br />
                      {a.description}
                    </>
                  ) : null}

                  {a.lien ? (
                    <>
                      <br />
                      <a
                        href={a.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                       📎 {t.viewLink}
                      </a>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
)}

<hr className="hr" />
     <h2>{t.giveReview}</h2>

      <p className="p">{t.reviewText}</p>

      <div style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <select
          className="input"
          value={formationAvis}
          onChange={(e) => setFormationAvis(e.target.value)}
        >
          <option value="">{t.chooseTraining}</option>
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
          placeholder={t.comment}
          value={commentaireAvis}
          onChange={(e) => setCommentaireAvis(e.target.value)}
        />

        <button className="button" onClick={saveAvisFormation}>
          {t.saveReview}
        </button>
      </div>

      <hr className="hr" />

      <h2>{t.memberReviews}</h2>

      {formationsValidees.length === 0 ? (
       <p className="p">{t.noTrainingYet}</p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {formationsValidees.map((f: any) => {
            const avis = avisParFormation[f.id];
            const moyenne = avis?.moyenne ?? 0;
            const count = avis?.count ?? 0;
            const commentaires = avis?.commentaires ?? [];

            return (
             <div
  key={f.id}
  className="card"
  style={{ marginTop: 0, cursor: "pointer" }}
  onClick={() => setFormationDetail(f)}
>
                <div className="badge-tile-title">{f.titre}</div>
{f.description ? (
  <div className="badge-tile-meta" style={{ marginBottom: 8 }}>
    <b>Description :</b> {f.description}
  </div>
) : null}

{f.competences ? (
  <div className="badge-tile-meta" style={{ marginBottom: 8 }}>
    <b>Objectifs / compétences :</b> {f.competences}
  </div>
) : null}
                
                <div className="badge-tile-meta" style={{ marginBottom: 8 }}>
                  {count > 0 ? (
                    <>⭐ {moyenne.toFixed(1)} / 5 — {count} avis</>
                  ) : (
                    <>{t.noReviews}</>
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

      <h2>{t.directoryProfile}</h2>

    <p className="p">{t.directoryIntro}</p>

      <div style={{ display: "grid", gap: 10, maxWidth: 600 }}>
       <label className="small">{t.city}</label>

        <input
          className="input"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="Ex : Bruxelles"
        />

        <label className="small">{t.postalCode}</label>

        <input
          className="input"
          value={codePostal}
          onChange={(e) => setCodePostal(e.target.value)}
          placeholder="Ex : 4000"
        />

        <label className="small">{t.presentation}</label>

        <textarea
          className="input"
          value={presentation}
          onChange={(e) => setPresentation(e.target.value)}
          placeholder={t.presentationPlaceholder}
        />

        <label className="small">
          <input
            type="checkbox"
            checked={annuaireVisible}
            onChange={(e) => setAnnuaireVisible(e.target.checked)}
          />{" "}
          {t.showInDirectory}
        </label>

        <label className="small">
          <input
            type="checkbox"
            checked={permisConduire}
            onChange={(e) => setPermisConduire(e.target.checked)}
          />{" "}
         {t.drivingLicense}
        </label>

        <label className="small">{t.conventionStatus}</label>

        <select
          className="input"
          value={statutConvention}
          onChange={(e) => setStatutConvention(e.target.value)}
        >
          <option value="">{t.noSpecify}</option>
          <option value="conventionne">Conventionné.e</option>
          <option value="deconventionne">Déconventionné.e</option>
        </select>

        <label className="small">
          <input
            type="checkbox"
            checked={conventionVisible}
            onChange={(e) => setConventionVisible(e.target.checked)}
          />{" "}
        {t.allowPublic}
        </label>

       <label className="small">{t.languages}</label>

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
             {getText(langue, "nom", lang)}
            </label>
          ))}
        </div>

    <button className="button" onClick={saveAnnuaire}>
    {t.save}
</button>
      </div>

      <hr className="hr" />

      <h2>{t.clinicalQuestions}</h2>

      <p className="p">{t.clinicalIntro}</p>

      <hr className="hr" />

     <h2>{t.askQuestion}</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <select
          className="input"
          value={questionDomaine}
          onChange={(e) => setQuestionDomaine(e.target.value)}
        >
          <option value="">{t.chooseDomain}</option>
         {domaines.map((d) => (
  <option key={d.id} value={d.id}>
    {getText(d, "nom", lang)}
  </option>
))}
        </select>

        <input
          className="input"
          value={questionTitre}
          onChange={(e) => setQuestionTitre(e.target.value)}
          placeholder={t.questionTitle}
        />

        <textarea
          className="input"
          value={questionTexte}
          onChange={(e) => setQuestionTexte(e.target.value)}
        placeholder={t.questionText}
        />

        <button className="button" onClick={publierQuestionClinique}>
          {t.publishQuestion}
        </button>
      </div>
      {formationDetail ? (
  <div
    className="card"
    style={{
      position: "fixed",
      inset: 20,
      zIndex: 999,
      overflow: "auto",
      maxWidth: 800,
      margin: "auto",
      maxHeight: "90vh",
    }}
  >
    <h2>{formationDetail.titre}</h2>

    <p className="p">
      <b>Durée :</b> {formationDetail.duree_heures}h
    </p>

    {formationDetail.date_formation ? (
      <p className="p">
        <b>Date :</b> {formationDetail.date_formation}
        {formationDetail.date_fin_formation
          ? ` → ${formationDetail.date_fin_formation}`
          : ""}
      </p>
    ) : null}

    {formationDetail.description ? (
      <>
        <h3>Description</h3>
        <p className="p">{formationDetail.description}</p>
      </>
    ) : null}

    {formationDetail.competences ? (
      <>
        <h3>Objectifs / compétences</h3>
        <p className="p">{formationDetail.competences}</p>
      </>
    ) : null}

    <button
      className="button secondary"
      onClick={() => setFormationDetail(null)}
    >
      Fermer
    </button>
  </div>
  ) : null}
    </main>
  );
}
