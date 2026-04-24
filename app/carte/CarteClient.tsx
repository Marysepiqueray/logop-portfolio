"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";

import L from "leaflet";

type MembreCarte = {
  id: string;
  nom: string;
  ville: string | null;
  code_postal: string | null;
  coords?: [number, number];
};

const centreBelgique: [number, number] = [50.5, 4.5];

const icon = new L.Icon({
  iconUrl: "/icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function FlyToUser({
  userPosition,
}: {
  userPosition: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (userPosition) {
      map.flyTo(userPosition, 11, {
        duration: 1.5,
      });
    }
  }, [userPosition, map]);

  return null;
}

async function getCoords(codePostal: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
        codePostal
      )}&country=Belgium&format=json&limit=1`
    );

    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.error(e);
  }

  return null;
}

export default function CarteClient() {
  const [membres, setMembres] = useState<MembreCarte[]>([]);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    async function loadMembres() {
      const { data, error } = await supabase
        .from("membres")
        .select("id, nom, ville, code_postal")
        .eq("annuaire_visible", true)
        .eq("membre_asbl", true)
        .eq("role", "membre");

      if (error) return;

      const liste: MembreCarte[] = [];

      for (const m of (data ?? []) as MembreCarte[]) {
        if (!m.code_postal) continue;

        const coords = await getCoords(m.code_postal);

        if (coords) {
          liste.push({
            ...m,
            coords,
          });
        }
      }

      setMembres(liste);
    }

    loadMembres();
  }, []);

  function meLocaliser() {
    if (!navigator.geolocation) {
      alert("Géolocalisation non disponible.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);
      },
      () => {
        alert("Impossible de vous localiser.");
      }
    );
  }

  return (
    <main className="card">
      <h1 className="h1">Carte des logopèdes</h1>

      <p className="p">
        Visualisez les membres de l’annuaire sur une carte de Belgique.
      </p>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className="button" onClick={meLocaliser}>
          📍 Me localiser
        </button>
      </div>

      <div style={{ overflow: "hidden", borderRadius: 12 }}>
        <MapContainer
          center={centreBelgique}
          zoom={8}
          style={{ height: "520px", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToUser userPosition={userPosition} />

          {userPosition && (
            <CircleMarker
              center={userPosition}
              radius={10}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#2563eb",
                fillOpacity: 0.8,
              }}
            >
              <Popup>Vous êtes ici</Popup>
            </CircleMarker>
          )}

          {membres.map((m) => {
            if (!m.coords) return null;

            return (
              <Marker
                key={m.id}
                position={m.coords}
                icon={icon}
              >
                <Popup>
                  <strong>{m.nom}</strong>
                  <br />
                  {[m.code_postal, m.ville]
                    .filter(Boolean)
                    .join(" ")}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </main>
  );
}
