'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useFetchLocalChallengeMutation } from '../captchaApi';
import styles from './LocalCaptchaWidget.module.scss';

/* ─────────────────────────────────────────────────────────────────
 * Built-in text captcha.
 *
 *   - On mount → request a fresh challenge from the backend. The
 *     response is `{ token, svg }`; the SVG is dropped into the DOM
 *     verbatim. The user types what they see.
 *   - As the user types we call `onToken("<token>|<answer>")` so the
 *     parent form's submit-disabled logic flips on/off in real time.
 *   - The refresh button asks for a brand-new challenge — needed if
 *     the rendered image is hard to read OR after a failed submit
 *     (challenges are single-use server-side).
 *
 * No third-party domains, no client-side secrets.
 * ──────────────────────────────────────────────────────────────── */

interface Props {
  /** Called with `<token>|<answer>` while the user is typing, or with
   *  '' when the field is empty / a fresh challenge hasn't arrived
   *  yet. The parent uses this to enable / disable submit. */
  onToken: (combined: string) => void;
  /** Bumped by the parent to force a reset, e.g. after the backend
   *  rejected the previous submit. */
  resetKey?: number;
}

export function LocalCaptchaWidget({ onToken, resetKey = 0 }: Props) {
  const id = useId();
  const [fetchChallenge, { isLoading }] = useFetchLocalChallengeMutation();
  const [token, setToken] = useState<string>('');
  const [svg, setSvg] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  /* Keep onToken in a ref so the load effect doesn't depend on it
   * (and therefore doesn't re-fetch every time the parent re-renders
   * with a fresh closure). */
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const load = async () => {
    try {
      const c = await fetchChallenge().unwrap();
      setToken(c.token);
      setSvg(c.svg);
      setAnswer('');
      onTokenRef.current('');
    } catch {
      setToken('');
      setSvg('');
      setAnswer('');
      onTokenRef.current('');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <input
          id={`local-captcha-${id}`}
          className={styles.input}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="Type the characters"
          value={answer}
          onChange={(e) => {
            const next = e.target.value;
            setAnswer(next);
            const trimmed = next.trim();
            onTokenRef.current(token && trimmed ? `${token}|${trimmed}` : '');
          }}
          aria-label="Captcha answer"
        />
        <div
          className={styles.image}
          /* The SVG is generated server-side and never contains user
           * input — safe to inject directly. We deliberately keep it
           * inline (rather than an <img src=>) so its colors honour
           * the active theme via currentColor in future iterations. */
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-hidden="true"
        />
        <button
          type="button"
          className={styles.refresh}
          onClick={() => void load()}
          disabled={isLoading}
          aria-label="Refresh captcha"
          title="Get a new challenge"
        >
          {/* Circular arrow icon — stroke uses currentColor so it
           *  reads in every theme without a hardcoded color. */}
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
