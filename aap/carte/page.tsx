"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const villesCoords: any = {
  Bruxelles: [50.8503, 4.3517],
  Liège: [50.6326, 5.5797],
  Namur: [50.4674, 4.8718],
  Charleroi: [50.4108, 4.4446],
  Mons: [50.4542, 3.9523],
  Arlon: [49.6833, 5.8167]
};

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41]
});

export default function CartePage() {
  const [membres, setMembres] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("membres")
        .select("id, nom, ville")
        .eq("annuaire_visible", true);

      setMembres(data ?? []);
    })();
  }, []);

  return (
    <main className="card">
      <h1 className="h1">Carte des logopèdes</h1>

      <MapContainer
        center={[50.5, 4.5]}
        zoom={8}
        style={{ height: "500px", width: "100%", borderRadius: 12 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {membres.map((m) => {
          const coords = villesCoords[m.ville];
          if (!coords) return null;

          return (
            <Marker key={m.id} position={coords} icon={icon}>
              <Popup>
                <b>{m.nom}</b><br />
                {m.ville}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </main>
  );
}
