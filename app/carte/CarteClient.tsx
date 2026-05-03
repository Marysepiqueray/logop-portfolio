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

const labels = {
  fr: {
    mapTitle: "Carte des logopèdes",
    mapIntro: "Visualisez les membres de l’annuaire sur une carte de Belgique.",
    locateMe: "📍 Me localiser",
    geolocationUnavailable: "Géolocalisation non disponible.",
    geolocationError: "Impossible de vous localiser.",
    youAreHere: "Vous êtes ici",
  },
  nl: {
    mapTitle: "Kaart van logopedisten",
    mapIntro: "Bekijk de leden van de gids op een kaart van België.",
    locateMe: "📍 Mijn locatie",
    geolocationUnavailable: "Geolocatie is niet beschikbaar.",
    geolocationError: "Kan uw locatie niet bepalen.",
    youAreHere: "U bent hier",
  },
  de: {
    mapTitle: "Karte der Logopädinnen und Logopäden",
    mapIntro: "Sehen Sie die Mitglieder des Verzeichnisses auf einer Karte von Belgien.",
    locateMe: "📍 Meinen Standort anzeigen",
    geolocationUnavailable: "Geolokalisierung ist nicht verfügbar.",
    geolocationError: "Ihr Standort konnte nicht ermittelt werden.",
    youAreHere: "Sie sind hier",
  },
};

type Lang = "fr" | "nl" | "de";

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
  const [lang, setLang] = useState<Lang>("fr");
  const [membres, setMembres] = useState<MembreCarte[]>([]);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");

    if (savedLang === "fr" || savedLang === "nl" || savedLang === "de") {
      setLang(savedLang);
    }
  }, []);

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

  const t = labels[lang];

  function meLocaliser() {
    if (!navigator.geolocation) {
      alert(t.geolocationUnavailable);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        alert(t.geolocationError);
      }
    );
  }

  return (
    <main className="card">
      <h1 className="h1">{t.mapTitle}</h1>

      <p className="p">{t.mapIntro}</p>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className="button" onClick={meLocaliser}>
          {t.locateMe}
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
              <Popup>{t.youAreHere}</Popup>
            </CircleMarker>
          )}

          {membres.map((m) => {
            if (!m.coords) return null;

            return (
              <Marker key={m.id} position={m.coords} icon={icon}>
                <Popup>
                  <strong>{m.nom}</strong>
                  <br />
                  {[m.code_postal, m.ville].filter(Boolean).join(" ")}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </main>
  );
}
