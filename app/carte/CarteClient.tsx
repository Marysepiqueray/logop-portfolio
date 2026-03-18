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

const villesCoords: Record<string, [number, number]> = {
  Bruxelles: [50.8503, 4.3517],
  Liège: [50.6326, 5.5797],
  Namur: [50.4674, 4.8718],
  Charleroi: [50.4108, 4.4446],
  Mons: [50.4542, 3.9523],
  Arlon: [49.6833, 5.8167],
  Verviers: [50.5891, 5.8624],
  Wavre: [50.7172, 4.6014],
  Nivelles: [50.5983, 4.3285],
  Tournai: [50.6056, 3.3886],
  Leuven: [50.8798, 4.7005],
  Bruges: [51.2093, 3.2247],
  Gand: [51.0543, 3.7174],
  Hasselt: [50.9307, 5.3325],
};

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

    loadMembres();
  }, []);

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
