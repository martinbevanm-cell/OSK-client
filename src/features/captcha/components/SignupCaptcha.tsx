'use client';

import { useGetCaptchaConfigQuery } from '../captchaApi';
import { TurnstileWidget } from './TurnstileWidget';
import { LocalCaptchaWidget } from './LocalCaptchaWidget';

/**
 * Thin wrapper that fetches the public captcha config and, if a
 * provider is configured + ready, renders the matching widget.
 *
 * When the captcha is disabled the component returns null and
 * immediately resolves a null token to the parent so the submit
 * button is never blocked.
 */
interface Props {
  /** Called with the verification token on success, or '' on reset/expire.
   *  Also called with '' on first render when the captcha is disabled
   *  so the parent can treat "no captcha needed" as "ready to submit". */
  onToken: (token: string) => void;
  /** Bumped by the parent to force the widget to reset (e.g. after a
   *  failed submit — the captcha challenge has already been spent). */
  resetKey?: number;
}

export function SignupCaptcha({ onToken, resetKey }: Props) {
  const { data, isLoading } = useGetCaptchaConfigQuery();

  /* Don't render anything until we know whether the captcha is on.
   * Returning null here also prevents a layout shift in the rare case
   * where the admin switches providers mid-session. */
  if (isLoading || !data) return null;
  if (!data.enabled || data.provider === 'none') return null;

  if (data.provider === 'turnstile') {
    if (!data.siteKey) return null;
    return <TurnstileWidget siteKey={data.siteKey} onToken={onToken} />;
  }

  if (data.provider === 'local') {
    return <LocalCaptchaWidget onToken={onToken} resetKey={resetKey} />;
  }

  return null;
}
