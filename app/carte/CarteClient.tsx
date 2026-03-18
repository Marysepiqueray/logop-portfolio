"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MembreCarte = {
  id: string;
  nom: string;
  ville: string | null;
};

const centreBelgique: [number, number] = [50.5, 4.5];

const coords = m.coords;

const icon = new L.Icon({
  iconUrl: "/icon.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export default function CarteClient() {
  const [membres, setMembres] = useState<MembreCarte[]>([]);

  useEffect(() => {
    async function loadMembres() {
      const { data } = await supabase
        .from("membres")
        .select("id, nom, ville")
        .eq("annuaire_visible", true)
        .eq("membre_asbl", true)
        .eq("role", "membre");

      setMembres((data ?? []) as MembreCarte[]);
    }

 useEffect(() => {
  async function loadMembres() {
    const { data } = await supabase
      .from("membres")
      .select("id, nom, ville, code_postal")
      .eq("annuaire_visible", true)
      .eq("membre_asbl", true)
      .eq("role", "membre");

    const membresAvecCoords = [];

    for (const m of data ?? []) {
      if (!m.code_postal) continue;

      const coords = await getCoords(m.code_postal);

      if (coords) {
        membresAvecCoords.push({
          ...m,
          coords,
        });
      }
    }

  return (
    <main className="card">
      <h1 className="h1">Carte des logopèdes</h1>

      <p className="p">
        Visualisez les membres de l’annuaire sur une carte de Belgique.
      </p>

      <div style={{ overflow: "hidden", borderRadius: 12 }}>
        <MapContainer
          center={centreBelgique}
          zoom={8}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {membres.map((m) => {
            if (!m.ville) return null;

            const coords = villesCoords[m.ville];
            if (!coords) return null;
          
async function getCoords(codePostal: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${codePostal}&country=Belgium&format=json`
    );
    const data = await res.json();

    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.error("Erreur géolocalisation", e);
  }

  return null;
}
            return (
              <Marker key={m.id} position={coords} icon={icon}>
                <Popup>
                  <strong>{m.nom}</strong>
                  <br />
                  {m.ville}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </main>
  );
}
