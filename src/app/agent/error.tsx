"use client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

export default function SpaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState icon="alert" title="Cette page n'a pas pu être chargée" action={<Button onClick={reset} icon="refresh">Réessayer</Button>}>
      Vérifiez votre connexion Internet puis réessayez. Si le problème persiste, contactez l&apos;assistance.
    </EmptyState>
  );
}
