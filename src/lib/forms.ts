/** Contrat commun des actions serveur appelées par les formulaires. */
export interface FormState {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Données de retour (ex. code OTP de démonstration, référence). */
  data?: Record<string, string>;
}
export type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;
