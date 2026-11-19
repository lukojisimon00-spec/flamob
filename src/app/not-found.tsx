import { LogoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="space-y-4">
        <LogoMark size={56} className="mx-auto" />
        <p className="font-mono text-sm text-muted">Erreur 404</p>
        <h1 className="text-2xl font-bold">Page introuvable</h1>
        <p className="max-w-sm text-muted">Le lien est peut-être incorrect, ou cette ressource n&apos;existe pas ou plus.</p>
        <ButtonLink href="/" icon="home">Retour à l&apos;accueil</ButtonLink>
      </div>
    </main>
  );
}
