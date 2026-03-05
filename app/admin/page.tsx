"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = { id: string; ordre: number; nom: string; description: string };

const SEUIL_BRONZE = 15;
const SEUIL_ARGENT = 45;
const SEUIL_OR = 90;

function tier(hours: number) {
  if (hours >= SEUIL_OR) return "OR";
  if (hours >= SEUIL_ARGENT) return "ARGENT";
  if (hours >= SEUIL_BRONZE) return "BRONZE";
  return "AUCUN";
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);

  const [membres, setMembres] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [validations, setValidations] = useState<any[]>([]);

  // ✅ stats réseau anonymisées
  const [reseau, setReseau] = useState<any>(null);

  // Recherche / sélection validation
  const [searchMembre, setSearchMembre] = useState("");
  const [searchFormation, setSearchFormation] = useState("");
  const [selectedMembre, setSelectedMembre] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("");

  // Création formation
  const [titreFormation, setTitreFormation] = useState("");
  const [dureeFormation, setDureeFormation] = useState<number>(14);
  const [niveauFormation, setNiveauFormation] = useState("");
  const [descriptionFormation, setDescriptionFormation] = useState("");
  const [competencesFormation, setCompetencesFormation] = useState("");

  const [typeFormation, setTypeFormation] = useState<"formation_interne" | "conference_interne">("formation_interne");
  const [domaineId, setDomaineId] = useState<string>("");

  async function buildReseauStats(allMembres: any[], allDomaines: Domaine[]) {
    // On calcule sur les membres "membre" uniquement
    const membresIds = (allMembres ?? []).filter((m) => m.role === "membre").map((m) => m.id);

    // 1) Toutes les validations (internes)
    const { data: v, error: ve } = await supabase
      .from("validations")
      .select("membre_id, formation:formations(domaine_id, duree_heures)")
      .in("membre_id", membresIds);

    if (ve) throw ve;

    // 2) Toutes les activités déclarées (externes / conf / webinaires)
    const { data: a, error: ae } = await supabase
      .from("activites")
      .select("membre_id, domaine_id, duree_heures, type")
      .in("membre_id", membresIds);

    if (ae) throw ae;

    // heures[membre_id][domaine_id] = total heures
    const heures: Record<string, Record<string, number>> = {};
    for (const mid of membresIds) heures[mid] = {};

    // Sommes internes
    for (const row of v ?? []) {
      const mid = row.membre_id as string;
      const dom = row.formation?.domaine_id as string | undefined;
      if (!mid || !dom) continue;
      const h = Number(row.formation?.duree_heures ?? 0);
      heures[mid][dom] = (heures[mid][dom] ?? 0) + h;
    }

    // Sommes déclarées (externes + conf + webinaire)
    let totalExternes = 0;
    let totalConferences = 0;
    let totalWebinaires = 0;

    for (const row of a ?? []) {
      const mid = row.membre_id as string;
      const dom = row.domaine_id as string | undefined;
      if (!mid || !dom) continue;

      const h = Number(row.duree_heures ?? 0);
      heures[mid][dom] = (heures[mid][dom] ?? 0) + h;

      if (row.type === "formation_externe") totalExternes += h;
      if (row.type === "conference") totalConferences += h;
      if (row.type === "webinaire") totalWebinaires += h;
    }

    // Total internes (heures internes = somme des validations)
    const totalInternes = (v ?? []).reduce((sum, row) => sum + Number(row.formation?.duree_heures ?? 0), 0);

    // 3) Calcul des compteurs par domaine
    const parDomaine = allDomaines.map((d) => {
      let nbOr = 0;
      let nbArgent = 0;
      let nbBronze = 0;
      let nbAucun = 0;

      for (const mid of membresIds) {
        const h = Number(heures[mid]?.[d.id
