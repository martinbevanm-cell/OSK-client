import styles from './AuthForm.module.scss';

/** Inline server-error banner used by every auth form. */
export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className={styles.errorBanner} role="alert" aria-live="assertive">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 6v5M10 13.5v.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
