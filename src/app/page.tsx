import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/button";
import { Badge, SimTag } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icons";
import { BankLogo } from "@/components/domain/BankLogo";
import { readDb } from "@/lib/db/store";
import { bankStatusLabel, bankStatusTone } from "@/lib/labels";

const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: "user", title: "Créez votre compte Flamob", text: "Avec votre numéro de téléphone, en quelques minutes." },
  { icon: "compare", title: "Comparez les banques", text: "Frais indicatifs, conditions, documents demandés : tout est affiché clairement." },
  { icon: "file", title: "Démarrez votre demande", text: "Remplissez votre demande d'ouverture de compte depuis votre téléphone et suivez son avancement." },
  { icon: "pin", title: "Trouvez un agent proche", text: "Un réseau de points de service pour être accompagné près de chez vous." },
];

const services: { title: string; text: string; state: "demo" | "prep" }[] = [
  { title: "Catalogue et comparateur bancaire", text: "Découvrir les offres et comparer les frais indicatifs.", state: "demo" },
  { title: "Demande d'ouverture de compte", text: "Parcours guidé avec suivi des étapes.", state: "demo" },
  { title: "Réseau d'agents Flamob", text: "Points de service de proximité, horaires et services.", state: "demo" },
  { title: "Dépôts et retraits via agent", text: "Simulés dans ce prototype. Opérations réelles soumises à partenariats et autorisations.", state: "prep" },
  { title: "Assistance de proximité", text: "Accompagnement dans les démarches bancaires.", state: "prep" },
];

const faq = [
  { q: "Flamob est-il une banque ?", a: "Non. Flamob est une plateforme technologique d'accès et d'intermédiation. Flamob ne détient pas l'argent des utilisateurs et ne revendique aucun agrément bancaire ou de paiement." },
  { q: "Les banques présentées sont-elles partenaires ?", a: "Non. Toutes les banques présentées dans ce prototype sont fictives. Aucun partenariat n'est revendiqué tant qu'il n'a pas été conclu et confirmé." },
  { q: "Puis-je vraiment ouvrir un compte ou déposer de l'argent ?", a: "Pas encore. Les demandes, dépôts et retraits sont simulés : aucun compte réel n'est ouvert, crédité ou débité. Les opérations réelles nécessiteront des partenariats, des contrats et les autorisations réglementaires appropriées." },
  { q: "Un agent peut-il me demander mon mot de passe bancaire ?", a: "Jamais. Un agent Flamob ne doit en aucun cas vous demander votre mot de passe, votre code PIN ou vos identifiants bancaires. Signalez toute demande de ce type." },
  { q: "Quelles devises sont prises en charge ?", a: "Le prototype gère le dollar américain (USD) et le franc congolais (CDF)." },
];

export default function Landing() {
  const db = readDb();
  const banks = db.banks.filter((b) => b.status !== "inactive");
  const openPoints = db.servicePoints.filter((p) => p.status === "open");
  const communes = new Set(db.servicePoints.map((p) => p.commune));
  return (
    <div className="bg-surface">
      <div className="bg-navy px-4 py-2 text-center text-xs text-white/85">
        Prototype de démonstration — banques fictives, opérations simulées. Aucune somme réelle n&apos;est déplacée.
      </div>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label="Accueil FLAMOB"><Logo size={32} /></Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex" aria-label="Navigation principale">
            <a href="#fonctionnement" className="hover:text-navy">Fonctionnement</a>
            <a href="#reseau" className="hover:text-navy">Réseau</a>
            <a href="#banques" className="hover:text-navy">Banques</a>
            <a href="#faq" className="hover:text-navy">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/connexion" variant="ghost" size="sm">Connexion</ButtonLink>
            <ButtonLink href="/inscription" size="sm" className="hidden min-[400px]:inline-flex">Créer un compte</ButtonLink>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-canvas">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge tone="brand">Plateforme d&apos;accès et de proximité — RDC</Badge>
              <h1 className="mt-4 text-[2.2rem] font-bold leading-[1.1] text-navy sm:text-5xl">
                Vos services financiers, <span className="text-cyan-700">plus proches.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-ink-soft sm:text-lg">
                Flamob connecte les particuliers aux banques et à un réseau d&apos;agents de proximité : découvrez les offres, démarrez une demande d&apos;ouverture de compte depuis votre téléphone et trouvez un point de service près de chez vous.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/inscription" size="lg" iconRight="arrowRight">Commencer</ButtonLink>
                <ButtonLink href="/connexion" size="lg" variant="secondary">Essayer la démo</ButtonLink>
              </div>
              <p className="mt-4 text-xs text-muted">Flamob n&apos;est pas une banque et ne conserve pas l&apos;argent des utilisateurs.</p>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-[1.75rem] border border-line bg-surface p-4 shadow-[var(--shadow-raised)]">
                <div className="flex items-center justify-between">
                  <Logo size={22} className="text-sm" />
                  <span className="grid size-8 place-items-center rounded-full bg-navy-50 text-navy"><Icon name="bell" size={16} /></span>
                </div>
                <p className="mt-5 text-sm text-muted">Bonjour Christelle</p>
                <p className="text-lg font-bold">Que voulez-vous faire ?</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {([["file", "Ouvrir un compte"], ["pin", "Agents proches"], ["arrowDown", "Dépôt"], ["arrowUp", "Retrait"]] as const).map(([i, t]) => (
                    <div key={t} className="rounded-xl border border-line p-3">
                      <Icon name={i} size={18} className="text-cyan-700" />
                      <p className="mt-2 text-sm font-semibold">{t}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-navy p-3.5 text-white">
                  <div className="flex items-center justify-between text-xs text-white/70"><span>Demande en cours</span><SimTag>Démo</SimTag></div>
                  <p className="mt-1 font-mono text-sm">FLM-DEM-261119-0012</p>
                  <div className="mt-3 flex gap-1">{[1, 1, 0, 0].map((on, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${on ? "bg-cyan" : "bg-white/20"}`} />)}</div>
                  <p className="mt-2 text-xs text-white/80">En cours d&apos;examen</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Comment fonctionne Flamob</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">Un parcours simple, pensé pour le mobile et pour les personnes qui découvrent les services bancaires.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-[var(--radius-card)] border border-line p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Icon name={s.icon} /></span>
                  <span className="font-mono text-sm text-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-canvas">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">Trois piliers</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { t: "Flamob Digital", d: "L'application : banques, comparateur, demandes, suivi, notifications.", i: "phone" as IconName },
                { t: "Flamob Agents", d: "Un réseau de points de service pour l'assistance et, à terme, les opérations autorisées en espèces.", i: "store" as IconName },
                { t: "Flamob Management", d: "La supervision centrale : réseau, demandes, opérations, incidents et paramètres.", i: "shield" as IconName },
              ].map((p) => (
                <div key={p.t} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
                  <Icon name={p.i} size={22} className="text-navy-700" />
                  <h3 className="mt-3 text-lg font-semibold">{p.t}</h3>
                  <p className="mt-1 text-sm text-muted">{p.d}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-14 text-xl font-semibold">Services envisagés</h3>
            <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
              {services.map((s) => (
                <li key={s.title} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted">{s.text}</p>
                  </div>
                  <Badge tone={s.state === "demo" ? "success" : "info"}>{s.state === "demo" ? "Disponible dans la démo" : "En préparation"}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="reseau" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Un réseau de proximité</h2>
            <p className="mt-3 text-ink-soft">Les agents Flamob accueillent, orientent et accompagnent les clients dans leurs démarches. À terme, et uniquement dans le cadre de contrats avec des institutions financières et des autorisations nécessaires, ils pourront réaliser des dépôts et retraits d&apos;espèces.</p>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              {["Agents identifiés et supervisés par Flamob", "Services et horaires affichés pour chaque point", "Consignes strictes : jamais de mot de passe bancaire demandé"].map((t) => (
                <li key={t} className="flex gap-2"><Icon name="check" size={18} className="text-cyan-700" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            <div className="rounded-[var(--radius-card)] bg-navy p-5 text-white"><p className="font-mono text-3xl font-semibold">{db.servicePoints.length}</p><p className="mt-1 text-sm text-white/75">points de service dans la démo</p></div>
            <div className="rounded-[var(--radius-card)] border border-line p-5"><p className="font-mono text-3xl font-semibold">{openPoints.length}</p><p className="mt-1 text-sm text-muted">ouverts actuellement</p></div>
            <div className="rounded-[var(--radius-card)] border border-line p-5"><p className="font-mono text-3xl font-semibold">{communes.size}</p><p className="mt-1 text-sm text-muted">communes de Kinshasa</p></div>
            <div className="rounded-[var(--radius-card)] border border-line p-5"><p className="font-mono text-3xl font-semibold">2</p><p className="mt-1 text-sm text-muted">devises : USD et CDF</p></div>
            <p className="col-span-2 text-xs text-muted">Données de démonstration : points de service et adresses fictifs.</p>
          </div>
        </section>

        <section id="banques" className="bg-canvas">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Banques de la démonstration</h2>
                <p className="mt-2 text-ink-soft">Établissements <strong>fictifs</strong>, créés pour illustrer le fonctionnement de la plateforme.</p>
              </div>
              <ButtonLink href="/inscription" variant="secondary" iconRight="arrowRight">Voir les offres</ButtonLink>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {banks.map((b) => (
                <li key={b.id} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                  <BankLogo name={b.name} shortName={b.shortName} color={b.color} />
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-sm text-muted">{b.tagline}</p>
                    <div className="flex flex-wrap gap-1.5"><SimTag>Fictive</SimTag><Badge tone={bankStatusTone[b.status]}>{bankStatusLabel[b.status]}</Badge></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
          <div className="mt-6 divide-y divide-line rounded-[var(--radius-card)] border border-line">
            {faq.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {f.q}<Icon name="plus" size={18} className="shrink-0 transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-2 text-sm text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contact" className="bg-navy text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Banque, partenaire, investisseur ?</h2>
              <p className="mt-2 max-w-xl text-white/80">Flamob construit une base technologique prête à se connecter à de futurs partenaires financiers, dans le respect du cadre réglementaire.</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Icon name="mail" size={18} className="text-cyan" />{db.settings.supportEmail}</p>
              <p className="flex items-center gap-2"><Icon name="phone" size={18} className="text-cyan" />{db.settings.supportPhone}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2"><LogoMark size={22} /><span>© {new Date().getFullYear()} Flamob — prototype</span></div>
          <nav className="flex flex-wrap gap-4" aria-label="Liens légaux">
            <Link href="/mentions-legales" className="hover:text-navy">Mentions légales</Link>
            <Link href="/mentions-legales#securite" className="hover:text-navy">Sécurité</Link>
            <Link href="/mentions-legales#conditions" className="hover:text-navy">Conditions d&apos;utilisation</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
