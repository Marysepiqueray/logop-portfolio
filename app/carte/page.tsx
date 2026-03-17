"use client";

import dynamic from "next/dynamic";

const CarteClient = dynamic(() => import("./CarteClient"), {
  ssr: false,
});

export default function CartePage() {
  return <CarteClient />;
}
