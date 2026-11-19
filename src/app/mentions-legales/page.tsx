import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata = { title: "Mentions légales et sécurité" };

export default function Legal() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" aria-label="Accueil FLAMOB"><Logo size={28} /></Link>
      <article className="mt-8 space-y-8 text-ink-soft [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-2 [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="text-3xl font-bold text-ink">Mentions légales, conditions et sécurité</h1>
        <section>
          <h2>Nature du service</h2>
          <p>Flamob est un <strong>prototype technologique de démonstration</strong>. Flamob n&apos;est pas une banque, ni un établissement de paiement, ni un établissement de monnaie électronique, et ne revendique aucune autorisation réglementaire.</p>
          <p>Flamob ne conserve pas l&apos;argent des utilisateurs et ne propose aucun portefeuille électronique.</p>
        </section>
        <section id="conditions">
          <h2>Conditions d&apos;utilisation de la démonstration</h2>
          <ul>
            <li>Les banques, offres, agents, points de service et adresses présentés sont <strong>fictifs</strong>.</li>
            <li>Les demandes d&apos;ouverture de compte sont simulées : aucune demande n&apos;est transmise à une banque et aucun compte réel n&apos;est ouvert.</li>
            <li>Les dépôts et retraits sont simulés : aucun compte bancaire réel n&apos;est crédité ou débité.</li>
            <li>Les frais, limites et commissions affichés sont indicatifs et configurables ; ils ne constituent pas une offre commerciale.</li>
            <li>Les SMS de vérification sont simulés : la vérification du numéro n&apos;a pas de valeur réelle.</li>
            <li>N&apos;utilisez pas de données personnelles réelles sensibles (numéros de pièce d&apos;identité, documents) dans la démonstration.</li>
          </ul>
        </section>
        <section id="securite">
          <h2>Sécurité</h2>
          <ul>
            <li>Ne communiquez jamais votre mot de passe bancaire, votre code PIN ou vos identifiants à qui que ce soit, y compris un agent Flamob.</li>
            <li>Un agent Flamob ne doit jamais utiliser vos identifiants bancaires ni effectuer une opération sans votre accord.</li>
            <li>Vérifiez toujours la référence de l&apos;opération sur votre reçu.</li>
            <li>Signalez tout comportement suspect via l&apos;assistance.</li>
          </ul>
        </section>
        <section>
          <h2>Données personnelles</h2>
          <p>Les mots de passe sont stockés sous forme hachée (scrypt). Les documents joints dans la démonstration ne sont pas conservés : seuls leur nom et leur taille sont enregistrés.</p>
        </section>
      </article>
    </div>
  );
}
