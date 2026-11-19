/**
 * Test de fumée de bout en bout (navigateur réel) contre une instance en cours d'exécution.
 * Prérequis : Playwright disponible (`npm i -D playwright && npx playwright install chromium` si absent)
 * et FLAMOB_DEMO_MODE=true sur le serveur.
 * Usage : BASE_URL=http://localhost:3000 npm run smoke
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let chromium;
try { ({ chromium } = await import("playwright")); } catch {
  console.error("Playwright introuvable. Installez-le : npm i -D playwright && npx playwright install chromium");
  process.exit(2);
}

const browser = await chromium.launch();
const failures = [];
const check = (ok, label) => { console.log(`${ok ? "✔" : "✘"} ${label}`); if (!ok) failures.push(label); };

async function session(role, paths) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/connexion`);
  await page.click(`button[value=${role}]`);
  await page.waitForURL((u) => !u.pathname.startsWith("/connexion"), { timeout: 15000 });
  for (const p of paths) {
    const res = await page.goto(BASE + p);
    check(res?.status() === 200, `[${role}] ${p}`);
  }
  check(errors.length === 0, `[${role}] aucune erreur JavaScript`);
  await ctx.close();
}

try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  for (const p of ["/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/mentions-legales", "/manifest.webmanifest"]) {
    const res = await page.goto(BASE + p);
    check(res?.status() === 200, `[public] ${p}`);
  }
  const res = await page.goto(`${BASE}/app`);
  check(page.url().includes("/connexion"), "[public] /app redirige vers la connexion");

  // Inscription + vérification OTP simulée
  const phone = `08${String(Date.now()).slice(-8)}`;
  await page.goto(`${BASE}/inscription`);
  await page.fill("input[name=lastName]", "Smoke");
  await page.fill("input[name=firstName]", "Test");
  await page.fill("input[name=phone]", phone);
  await page.fill("input[name=password]", "Motdepasse1");
  await page.fill("input[name=confirm]", "Motdepasse1");
  await page.check("input[name=terms]");
  await page.click("button[type=submit]");
  await page.waitForURL(`${BASE}/verification`);
  await page.getByRole("button", { name: "Recevoir le code" }).click();
  const code = (await page.locator("[data-demo-code]").textContent())?.trim();
  await page.fill("input[name=code]", code ?? "");
  await page.getByRole("button", { name: "Vérifier" }).click();
  await page.waitForURL(`${BASE}/app`);
  check(true, "[public] inscription + vérification OTP simulée");
  await ctx.close();

  await session("client", ["/app", "/app/banques", "/app/comparateur", "/app/demandes", "/app/demandes/nouvelle", "/app/agents", "/app/operations/depot", "/app/operations/retrait", "/app/activites", "/app/notifications", "/app/profil", "/app/assistance"]);
  await session("agent", ["/agent", "/agent/operations", "/agent/operations/nouvelle", "/agent/tresorerie", "/agent/commissions", "/agent/profil", "/agent/point", "/agent/securite", "/agent/notifications", "/agent/incidents"]);
  await session("admin", ["/admin", "/admin/utilisateurs", "/admin/agents", "/admin/agents/nouveau", "/admin/points", "/admin/banques", "/admin/demandes", "/admin/operations", "/admin/commissions", "/admin/incidents", "/admin/notifications", "/admin/parametres", "/admin/journal", "/admin/roles"]);
} catch (e) {
  failures.push(String(e));
  console.error(e);
} finally {
  await browser.close();
}
console.log(failures.length ? `\n${failures.length} échec(s).` : "\nTous les contrôles sont passés.");
process.exit(failures.length ? 1 : 0);
