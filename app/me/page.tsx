"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Domaine = {
  id: string;
  ordre: number;
  nom: string;
  description: string;
};

function medal(hours:number){
  if(hours>=90) return {label:"OR",icon:"🥇"}
  if(hours>=45) return {label:"ARGENT",icon:"🥈"}
  if(hours>=15) return {label:"BRONZE",icon:"🥉"}
  return {label:"AUCUN",icon:"⬜"}
}

export default function MePage(){

const [loading,setLoading]=useState(true)

const [membre,setMembre]=useState<any>(null)
const [domaines,setDomaines]=useState<Domaine[]>([])
const [validations,setValidations]=useState<any[]>([])
const [activites,setActivites]=useState<any[]>([])

const [ville,setVille]=useState("")
const [presentation,setPresentation]=useState("")
const [annuaireVisible,setAnnuaireVisible]=useState(false)

useEffect(()=>{
(async()=>{

const {data:userData}=await supabase.auth.getUser()
const userId=userData.user?.id

if(!userId){
window.location.href="/"
return
}

const {data:m}=await supabase
.from("membres")
.select("*")
.eq("auth_id",userId)
.maybeSingle()

const {data:d}=await supabase
.from("domaines")
.select("id,ordre,nom,description")
.order("ordre",{ascending:true})

const {data:v}=await supabase
.from("validations")
.select("formation:formations(domaine_id,duree_heures)")
.eq("membre_id",m?.id)

const {data:a}=await supabase
.from("activites")
.select("domaine_id,duree_heures,type")
.eq("membre_id",m?.id)

setMembre(m)
setDomaines((d??[]) as any)
setValidations(v??[])
setActivites(a??[])

setVille(m?.ville??"")
setPresentation(m?.presentation??"")
setAnnuaireVisible(m?.annuaire_visible??false)

setLoading(false)

})()
},[])

const passeport=useMemo(()=>{

const heures:Record<string,number>={}

for(const row of validations as any[]){
const formation=row.formation as any
const dom=formation?.domaine_id
if(!dom) continue
const h=Number(formation?.duree_heures??0)
heures[dom]=(heures[dom]??0)+h
}

for(const row of activites as any[]){
const dom=row.domaine_id
if(!dom) continue
const h=Number(row.duree_heures??0)
heures[dom]=(heures[dom]??0)+h
}

return domaines.map(d=>{
const h=Number(heures[d.id]??0)
const med=medal(h)
return{
domaine:d,
heures:h,
medal:med
}
})

},[domaines,validations,activites])

async function saveAnnuaire(){

const {data:userData}=await supabase.auth.getUser()
const userId=userData.user?.id

if(!userId){
alert("Utilisateur non connecté")
return
}

const {error}=await supabase
.from("membres")
.update({
ville:ville,
presentation:presentation,
annuaire_visible:annuaireVisible
})
.eq("auth_id",userId)

if(error){
alert(error.message)
return
}

alert("Profil annuaire enregistré")

}

async function generatePDF(){

const res=await fetch("/api/portfolio")

if(!res.ok){
alert("Erreur génération PDF")
return
}

const blob=await res.blob()
const url=window.URL.createObjectURL(blob)

const a=document.createElement("a")
a.href=url
a.download="portfolio.pdf"
a.click()

}

if(loading){
return <main className="card">Chargement…</main>
}

return(

<main className="card">

<h1 className="h1">Mon portfolio</h1>

<div className="row">

<button
className="button"
onClick={generatePDF}
>
Télécharger le portfolio PDF
</button>

</div>

<hr className="hr"/>

<h2>Mes domaines</h2>

<div className="badge-grid">

{passeport.map((p:any)=>{

const pct=Math.min(100,(p.heures/90)*100)

return(

<div key={p.domaine.id} className="badge-tile">

<div className="badge-medal">
{p.medal.icon}
</div>

<div>

<div className="badge-tile-title">
{p.domaine.nom}
</div>

<div className="badge-tile-meta">
{p.domaine.description}
</div>

<div className="badge-tile-meta">
{p.medal.label} — {p.heures}h
</div>

<div className="progress">
<div style={{width:`${pct}%`}}/>
</div>

</div>

</div>

)

})}

</div>

<hr className="hr"/>

<h2>Profil dans l’annuaire</h2>

<p className="p">
Choisissez si vous souhaitez apparaître dans l’annuaire des logopèdes.
</p>

<div style={{display:"grid",gap:10,maxWidth:600}}>

<label className="small">Ville</label>

<input
className="input"
value={ville}
onChange={(e)=>setVille(e.target.value)}
placeholder="Ex : Bruxelles"
/>

<label className="small">Présentation</label>

<textarea
className="input"
value={presentation}
onChange={(e)=>setPresentation(e.target.value)}
placeholder="Décrivez brièvement votre pratique."
/>

<label className="small">

<input
type="checkbox"
checked={annuaireVisible}
onChange={(e)=>setAnnuaireVisible(e.target.checked)}
/>

{" "}Apparaître dans l’annuaire

</label>

<button
className="button"
onClick={saveAnnuaire}
>
Enregistrer
</button>

</div>

</main>

)
}
