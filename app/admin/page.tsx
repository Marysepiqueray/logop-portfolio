"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = {
  id: string;
  ordre: number;
  nom: string;
  description: string;
};

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

  const [loading,setLoading]=useState(true)

  const [membres,setMembres]=useState<any[]>([])
  const [formations,setFormations]=useState<any[]>([])
  const [domaines,setDomaines]=useState<Domaine[]>([])
  const [validations,setValidations]=useState<any[]>([])
  const [reseau,setReseau]=useState<any>(null)

  const [searchMembre,setSearchMembre]=useState("")
  const [searchFormation,setSearchFormation]=useState("")

  const [selectedMembre,setSelectedMembre]=useState("")
  const [selectedFormation,setSelectedFormation]=useState("")

  const [titreFormation,setTitreFormation]=useState("")
  const [dureeFormation,setDureeFormation]=useState<number>(14)
  const [niveauFormation,setNiveauFormation]=useState("")
  const [descriptionFormation,setDescriptionFormation]=useState("")
  const [competencesFormation,setCompetencesFormation]=useState("")

  const [typeFormation,setTypeFormation]=useState<"formation_interne"|"conference_interne">("formation_interne")
  const [domaineId,setDomaineId]=useState("")

  async function loadBaseData(){

    const {data:m}=await supabase.from("membres").select("*")

    const {data:d}=await supabase
      .from("domaines")
      .select("id,ordre,nom,description")
      .order("ordre",{ascending:true})

    const {data:f}=await supabase
      .from("formations")
      .select("id,titre,duree_heures,niveau,domaine_id,type,created_at")
      .order("created_at",{ascending:false})

    const {data:v}=await supabase
      .from("validations")
      .select("id,date_validation,membres!membre_id(nom,email),formations(titre)")
      .order("date_validation",{ascending:false})
      .limit(20)

    setMembres(m??[])
    setDomaines((d??[]) as any)
    setFormations(f??[])
    setValidations(v??[])
  }

  async function buildReseauStats(allMembres:any[],allDomaines:Domaine[]){

    const membresIds=allMembres
      .filter(m=>m.role==="membre")
      .map(m=>m.id)

    const {data:v}=await supabase
      .from("validations")
      .select("membre_id,formation:formations(domaine_id,duree_heures)")
      .in("membre_id",membresIds)

    const {data:a}=await supabase
      .from("activites")
      .select("membre_id,domaine_id,duree_heures,type")
      .in("membre_id",membresIds)

    const heures:Record<string,Record<string,number>>={}
    for(const mid of membresIds){heures[mid]={}}

    for(const row of (v??[]) as any[]){

      const mid=row.membre_id
      const formation=row.formation

      const dom=formation?.domaine_id

      if(!mid||!dom) continue

      const h=Number(formation?.duree_heures??0)

      heures[mid][dom]=(heures[mid][dom]??0)+h
    }

    let totalExternes=0
    let totalConferences=0
    let totalWebinaires=0

    for(const row of (a??[]) as any[]){

      const mid=row.membre_id
      const dom=row.domaine_id

      if(!mid||!dom) continue

      const h=Number(row.duree_heures??0)

      heures[mid][dom]=(heures[mid][dom]??0)+h

      if(row.type==="formation_externe") totalExternes+=h
      if(row.type==="conference") totalConferences+=h
      if(row.type==="webinaire") totalWebinaires+=h
    }

    const totalInternes=(v??[]).reduce((s:any,row:any)=>s+Number(row.formation?.duree_heures??0),0)

    const parDomaine=allDomaines.map(d=>{

      let nbOr=0
      let nbArgent=0
      let nbBronze=0
      let nbAucun=0

      for(const mid of membresIds){

        const h=Number(heures[mid]?.[d.id]??0)

        const t=tier(h)

        if(t==="OR") nbOr++
        else if(t==="ARGENT") nbArgent++
        else if(t==="BRONZE") nbBronze++
        else nbAucun++
      }

      return{
        domaine:d,
        nbOr,
        nbArgent,
        nbBronze,
        nbAucun
      }
    })

    return{
      nbMembres:membresIds.length,
      totalInternes,
      totalExternes,
      totalConferences,
      totalWebinaires,
      parDomaine
    }
  }

  useEffect(()=>{
    (async()=>{

      const {data:userData}=await supabase.auth.getUser()

      const userId=userData.user?.id

      if(!userId){
        window.location.href="/"
        return
      }

      const {data:row}=await supabase
        .from("membres")
        .select("role")
        .eq("auth_id",userId)
        .maybeSingle()

      if(!row||row.role!=="admin"){
        window.location.href="/"
        return
      }

      await loadBaseData()

      const {data:m}=await supabase.from("membres").select("*")

      const {data:d}=await supabase
        .from("domaines")
        .select("id,ordre,nom,description")
        .order("ordre",{ascending:true})

      const stats=await buildReseauStats(m??[],(d??[]) as any)

      setReseau(stats)

      setLoading(false)

    })()
  },[])

  if(loading){
    return <main className="card">Chargement…</main>
  }

  return(

    <main className="card">

      <h1 className="h1">Administration</h1>

      <hr className="hr"/>

      <h2>Tableau de bord du réseau</h2>

      {!reseau?(
        <p className="p">Statistiques indisponibles</p>
      ):(
        <>
          <div className="row">

            <span className="badge">
              Membres : {reseau.nbMembres}
            </span>

            <span className="badge">
              Heures internes : {Math.round(reseau.totalInternes)}h
            </span>

            <span className="badge">
              Heures externes : {Math.round(reseau.totalExternes)}h
            </span>

            <span className="badge">
              Conférences : {Math.round(reseau.totalConferences)}h
            </span>

            <span className="badge">
              Webinaires : {Math.round(reseau.totalWebinaires)}h
            </span>

          </div>

          <div style={{marginTop:14}}>

            {reseau.parDomaine.map((x:any)=>(
              <div key={x.domaine.id} className="small" style={{marginBottom:6}}>

                <b>{x.domaine.nom}</b>

                {" — "}

                🥇 {x.nbOr}

                {" • "}

                🥈 {x.nbArgent}

                {" • "}

                🥉 {x.nbBronze}

                {" • "}

                ⬜ {x.nbAucun}

              </div>
            ))}

          </div>
        </>
      )}
<hr className="hr"/>

<h2>Créer une formation interne</h2>

<div style={{display:"grid",gap:10,maxWidth:700}}>

<input
className="input"
placeholder="Titre de la formation"
value={titreFormation}
onChange={(e)=>setTitreFormation(e.target.value)}
/>

<div className="row">

<select
className="input"
value={typeFormation}
onChange={(e)=>setTypeFormation(e.target.value as any)}
>
<option value="formation_interne">Formation interne</option>
<option value="conference_interne">Conférence interne</option>
</select>

<input
className="input"
type="number"
placeholder="Durée (heures)"
value={dureeFormation}
onChange={(e)=>setDureeFormation(Number(e.target.value))}
/>

</div>

<select
className="input"
value={domaineId}
onChange={(e)=>setDomaineId(e.target.value)}
>
<option value="">Choisir un domaine</option>

{domaines.map(d=>(
<option key={d.id} value={d.id}>
{d.nom}
</option>
))}

</select>

<input
className="input"
placeholder="Niveau (optionnel)"
value={niveauFormation}
onChange={(e)=>setNiveauFormation(e.target.value)}
/>

<textarea
className="input"
placeholder="Description"
value={descriptionFormation}
onChange={(e)=>setDescriptionFormation(e.target.value)}
/>

<textarea
className="input"
placeholder="Compétences"
value={competencesFormation}
onChange={(e)=>setCompetencesFormation(e.target.value)}
/>

<button
className="button"
onClick={createFormation}
>
Ajouter la formation
</button>

</div>
    </main>
  )
}
