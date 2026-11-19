import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";

// Toutes les pages lisent des données vivantes : rendu dynamique (pas de pré-rendu figé au build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "FLAMOB — Vos services financiers, plus proches", template: "%s · FLAMOB" },
  description: "Prototype de démonstration : plateforme d'accès aux services financiers de proximité en RDC. Banques fictives, opérations simulées.",
  applicationName: "FLAMOB",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#10243A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
