'use client';

import { useMemo, useState } from 'react';
import type { RangePreset } from '../heroSearch.data';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './RangePanel.module.scss';

export interface RangeValue {
  min: number | null;
  max: number | null;
}

interface RangePanelProps {
  /** Heading shown over the preset columns (e.g. "Min price"). */
  minLabel: string;
  maxLabel: string;
  /** Presets are shared across min and max — no upper bound = null. */
  presets: RangePreset[];
  /** Optional currency / unit prefix and suffix for the custom inputs. */
  prefix?: string;
  suffix?: string;
  /** External (committed) value. */
  value: RangeValue;
  /** Called on Apply with a validated range. */
  onChange: (value: RangeValue) => void;
  close: () => void;
}

/**
 * Reusable min/max picker — two preset columns + a "custom" pair of inputs.
 * Validates that min < max and that values are non-negative integers.
 */
export function RangePanel({
  minLabel,
  maxLabel,
  presets,
  prefix,
  suffix,
  value,
  onChange,
  close,
}: RangePanelProps) {
  const [min, setMin] = useState<number | null>(value.min);
  const [max, setMax] = useState<number | null>(value.max);
  const [minRaw, setMinRaw] = useState<string>(value.min?.toString() ?? '');
  const [maxRaw, setMaxRaw] = useState<string>(value.max?.toString() ?? '');

  const error = useMemo(() => {
    if (min !== null && (Number.isNaN(min) || min < 0)) return 'Enter a positive number';
    if (max !== null && (Number.isNaN(max) || max < 0)) return 'Enter a positive number';
    if (min !== null && max !== null && min >= max) return 'Min must be less than max';
    return null;
  }, [min, max]);

  const onCustom = (
    raw: string,
    setRaw: (v: string) => void,
    setVal: (v: number | null) => void,
  ) => {
    setRaw(raw);
    if (raw.trim() === '') {
      setVal(null);
      return;
    }
    const cleaned = raw.replace(/[^0-9]/g, '');
    setVal(cleaned ? Number(cleaned) : null);
  };

  const apply = () => {
    if (error) return;
    onChange({ min, max });
    close();
  };

  const reset = () => {
    setMin(null);
    setMax(null);
    setMinRaw('');
    setMaxRaw('');
    onChange({ min: null, max: null });
    close();
  };

  return (
    <div className={styles.root}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <p className={styles.columnHeading}>{minLabel}</p>
          <ul className={styles.presetList}>
            {presets.map((p) => {
              const active = p.value === min;
              return (
                <li key={`min-${p.label}`}>
                  <button
                    type="button"
                    className={cn(styles.preset, active && styles.presetActive)}
                    onClick={() => {
                      setMin(p.value);
                      setMinRaw(p.value === null ? '' : String(p.value));
                    }}
                  >
                    {p.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.column}>
          <p className={styles.columnHeading}>{maxLabel}</p>
          <ul className={styles.presetList}>
            {presets.map((p) => {
              const active = p.value === max;
              return (
                <li key={`max-${p.label}`}>
                  <button
                    type="button"
                    className={cn(styles.preset, active && styles.presetActive)}
                    onClick={() => {
                      setMax(p.value);
                      setMaxRaw(p.value === null ? '' : String(p.value));
                    }}
                  >
                    {p.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className={styles.customRow}>
        <p className={styles.columnHeading}>Custom range</p>
        <div className={styles.customInputs}>
          <CustomField
            label={minLabel}
            prefix={prefix}
            suffix={suffix}
            value={minRaw}
            onChange={(raw) => onCustom(raw, setMinRaw, setMin)}
            invalid={!!error && min !== null}
          />
          <span className={styles.dash} aria-hidden="true">
            —
          </span>
          <CustomField
            label={maxLabel}
            prefix={prefix}
            suffix={suffix}
            value={maxRaw}
            onChange={(raw) => onCustom(raw, setMaxRaw, setMax)}
            invalid={!!error && max !== null}
          />
        </div>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.linkBtn} onClick={reset}>
          Reset
        </button>
        <Button type="button" size="sm" onClick={apply} disabled={!!error}>
          Apply
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface CustomFieldProps {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}

function CustomField({
  label,
  prefix,
  suffix,
  value,
  invalid,
  onChange,
}: CustomFieldProps) {
  return (
    <label className={cn(styles.field, invalid && styles.fieldInvalid)}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldShell}>
        {prefix ? <span className={styles.affix}>{prefix}</span> : null}
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="No limit"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.input}
        />
        {suffix ? <span className={styles.affix}>{suffix}</span> : null}
      </span>
    </label>
  );
}
