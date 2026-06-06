import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import styles from './TextField.module.scss';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labeled text input with inline validation message. RHF-friendly (forwardRef). */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, id, className, ...rest }, ref) {
    const autoId = useId();
    const inputId = id ?? `${rest.name ?? 'field'}-${autoId}`;

    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={cn(styles.input, error && styles.inputError, className)}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {error ? (
          <span className={styles.error}>{error}</span>
        ) : hint ? (
          <span className={styles.hint}>{hint}</span>
        ) : null}
      </div>
    );
  },
);
