"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function medal(hours:number){
  if(hours>=90) return {label:"OR",icon:"🥇",next:90}
  if(hours>=45) return {label:"ARGENT",icon:"🥈",next:90}
  if(hours>=15) return {label:"BRONZE",icon:"🥉",next:45}
  return {label:"Aucun",icon:"⬜",next:15}
}

export default function MePage(){

const[loading,setLoading]=useState(true)
const[membre,setMembre]=useState<any>(null)

const[domaines,setDomaines]=useState<any[]>([])
const[validations,setValidations]=useState<any[]>([])
const[activites,setActivites]=useState<any[]>([])
const[formations,setFormations]=useState<any[]>([])

const[typeAct,setTypeAct]=useState("formation_externe")
const[titreAct,setTitreAct]=useState("")
const[organismeAct,setOrganismeAct]=useState("")
const[dateAct,setDateAct]=useState(new Date().toISOString().slice(0,10))
const[heuresAct,setHeuresAct]=useState<number>(0)
const[domaineAct,setDomaineAct]=useState("")

useEffect(()=>{

(async()=>{

const{data:userData}=await supabase.auth.getUser()
const userId=userData.user?.id

if(!userId){
window.location.href="/"
return
}

const{data:m}=await supabase
.from("membres")
.select("*")
.eq("auth_id",userId)
.maybeSingle()

if(!m){
alert("Compte non lié")
return
}

setMembre(m)

const{data:d}=await supabase
.from("domaines")
.select("*")
.order("ordre",{ascending:true})

setDomaines(d??[])

const{data:v}=await supabase
.from("validations")
.select("date_validation,formation:formations(titre,duree_heures,niveau,domaine_id,type)")
.eq("membre_id",m.id)

setValidations(v??[])

const{data:a}=await supabase
.from("activites")
.select("*")
.eq("membre_id",m.id)

setActivites(a??[])

const{data:f}=await supabase
.from("formations")
.select("*")

setFormations(f??[])

setLoading(false)

})()

},[])

const heuresParDomaine=useMemo(()=>{

const map:any={}

validations.forEach(v=>{
const d=v.formation?.domaine_id
if(!d)return
map[d]=(map[d]??0)+Number(v.formation?.duree_heures??0)
})

activites.forEach(a=>{
const d=a.domaine_id
if(!d)return
map[d]=(map[d]??0)+Number(a.duree_heures??0)
})

return map

},[validations,activites])

const passeport=useMemo(()=>{

return domaines.map(d=>{

const h=Number(heuresParDomaine[d.id]??0)
const m=medal(h)
const next=m.next
const missing=Math.max(0,next-h)

return{
domaine:d,
heures:h,
medal:m,
missing
}

})

},[domaines,heuresParDomaine])

const objectif=useMemo(()=>{

const candidates=passeport.filter(p=>p.missing>0)

if(candidates.length===0)return null

candidates.sort((a,b)=>a.missing-b.missing)

return candidates[0]

},[passeport])

const recommandations=useMemo(()=>{

if(!objectif)return[]

return formations
.filter(f=>f.domaine_id===objectif.domaine.id)
.slice(0,3)

},[objectif,formations])

async function addActivite(){

if(!titreAct)return alert("Titre requis")

const{error}=await supabase.from("activites").insert({

membre_id:membre.id,
type:typeAct,
titre:titreAct,
organisme:organismeAct,
date:dateAct,
duree_heures:heuresAct,
domaine_id:domaineAct,
statut:"non_validee"

})

if(error)return alert(error.message)

alert("Activité ajoutée")

window.location.reload()

}

async function downloadPdf(){

const{data:session}=await supabase.auth.getSession()
const token=session.session?.access_token

const res=await fetch("/api/portfolio",{
headers:{Authorization:`Bearer ${token}`}
})

const blob=await res.blob()

const url=window.URL.createObjectURL(blob)

const a=document.createElement("a")
a.href=url
a.download="portfolio.pdf"
a.click()

}

if(loading)return<div className="card">Chargement...</div>

return(

<main className="card">

<h1 className="h1">Passeport de compétences</h1>

<p className="p">
Membre : <b>{membre.nom}</b>
</p>

<button className="button" onClick={downloadPdf}>
Télécharger mon portfolio PDF
</button>

<hr className="hr"/>

<h2>Objectif prochain niveau</h2>

{objectif&&(

<div className="card">

<b>{objectif.domaine.nom}</b>

<div className="small">
Vous avez {objectif.heures}h — il vous manque {objectif.missing}h
</div>

<div className="small" style={{marginTop:10}}>
Formations proposées :
</div>

<ul>

{recommandations.map(f=>(
<li key={f.id}>
{f.titre} — {f.duree_heures}h
</li>
))}

</ul>

</div>

)}

<hr className="hr"/>

<h2>Mes domaines</h2>

<div className="badge-grid">

{passeport.map(p=>{

const pct=Math.min(100,(p.heures/p.medal.next)*100)

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
{p.medal.label} — {p.heures}h
</div>

<div className="progress" style={{marginTop:6}}>
<div style={{width:`${pct}%`}}/>
</div>

</div>

</div>

)

})}

</div>

<hr className="hr"/>

<h2>Déclarer une activité</h2>

<select
className="input"
value={typeAct}
onChange={e=>setTypeAct(e.target.value)}
>

<option value="formation_externe">Formation externe</option>
<option value="conference">Conférence</option>
<option value="webinaire">Webinaire</option>

</select>

<input
className="input"
placeholder="Titre"
value={titreAct}
onChange={e=>setTitreAct(e.target.value)}
/>

<input
className="input"
placeholder="Organisme"
value={organismeAct}
onChange={e=>setOrganismeAct(e.target.value)}
/>

<input
className="input"
type="number"
placeholder="Durée (heures)"
value={heuresAct}
onChange={e=>setHeuresAct(Number(e.target.value))}
/>

<select
className="input"
value={domaineAct}
onChange={e=>setDomaineAct(e.target.value)}
>

<option value="">Choisir un domaine</option>

{domaines.map(d=>(
<option key={d.id} value={d.id}>
{d.nom}
</option>
))}

</select>

<button className="button" onClick={addActivite}>
Ajouter (non validée)
</button>

</main>

)

}
