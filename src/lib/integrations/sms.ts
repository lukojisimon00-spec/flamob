/**
 * Fournisseur SMS — point d'intégration futur (agrégateur SMS / opérateur télécom).
 *
 * Aucun fournisseur réel n'est configuré dans le prototype : `SimulatedSmsProvider`
 * n'envoie rien. Le code OTP est renvoyé à l'appelant pour être affiché à l'écran en
 * mode démonstration uniquement. Un OTP simulé NE CONSTITUE PAS une vérification réelle.
 *
 * Pour brancher un fournisseur : implémenter `SmsProvider` et le retourner dans `getSmsProvider()`
 * (clé API à fournir via variable d'environnement serveur, jamais côté client).
 */
export interface SmsDelivery {
  delivered: boolean;
  simulated: boolean;
  /** Présent uniquement pour le fournisseur simulé (affichage démo). */
  demoCode?: string;
}

export interface SmsProvider {
  sendOtp(phone: string, code: string): SmsDelivery;
}

export class SimulatedSmsProvider implements SmsProvider {
  sendOtp(_phone: string, code: string): SmsDelivery {
    return { delivered: false, simulated: true, demoCode: code };
  }
}

export function getSmsProvider(): SmsProvider {
  return new SimulatedSmsProvider();
}
