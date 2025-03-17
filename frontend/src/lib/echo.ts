// lib/echo.ts
"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Echo?: Echo;
    Pusher?: typeof Pusher;
  }
}

if (typeof window !== "undefined") {
  window.Pusher = Pusher;
}

export default function getEcho(): Echo | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token manquant pour Echo");
    return null;
  }

  if (window.Echo) return window.Echo;

  const echo = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT),
    scheme: process.env.NEXT_PUBLIC_REVERB_SCHEME,
    disableStats: true,
    enabledTransports: ["ws"],
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
    authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  echo.connector.pusher.connection.bind("connected", () => {
    console.log("Connecté à Reverb WebSocket");
  });

  echo.connector.pusher.connection.bind("disconnected", () => {
    console.warn("Déconnecté de Reverb, tentative de reconnexion...");
  });

  echo.connector.pusher.connection.bind("error", (err: any) => {
    console.error("Erreur Reverb:", err);
  });

  window.Echo = echo;
  return echo;
}
