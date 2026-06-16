/**
 * Google OAuth contracts. Public config tells the frontend whether
 * to render the "Continue with Google" button; the admin DTO is for
 * the settings page.
 */
import type { MaskedSecretField } from './pricing.dto';

export interface GoogleAuthPublicConfig {
  enabled: boolean;
  /** Where Google will redirect after consent. The operator pastes
   *  this into the Google Cloud "Authorized redirect URIs" list. */
  callbackUrl: string;
}

export interface GoogleAuthSettingsDTO {
  enabled: boolean;
  clientId: string;
  clientSecret: MaskedSecretField;
  ready: boolean;
}

export interface UpdateGoogleAuthSettingsDto {
  enabled?: boolean;
  clientId?: string;
  /** Plain-text on the way in; encrypted at rest by the backend.
   *  Omit to keep the existing secret unchanged. */
  clientSecret?: string;
}
