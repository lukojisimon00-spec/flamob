import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FLAMOB (démonstration)",
    short_name: "FLAMOB",
    description: "Vos services financiers, plus proches. Prototype — opérations simulées.",
    start_url: "/app",
    display: "standalone",
    background_color: "#F5F7FA",
    theme_color: "#10243A",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
