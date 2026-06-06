'use client';

import { useState } from 'react';
import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
  type PropertySubCategory,
} from '../heroSearch.data';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './PropertyTypePanel.module.scss';

export interface PropertyTypeSelection {
  category: PropertyCategory;
  subcategories: PropertySubCategory[];
}

interface PropertyTypePanelProps {
  selection: PropertyTypeSelection | null;
  onChange: (selection: PropertyTypeSelection | null) => void;
  close: () => void;
}

/**
 * Two-pane picker: pick a category on the left, then toggle one or more
 * sub-categories on the right. "All <category>" clears the sub set so the
 * filter just narrows by the high-level type.
 */
export function PropertyTypePanel({
  selection,
  onChange,
  close,
}: PropertyTypePanelProps) {
  const [active, setActive] = useState<PropertyCategory>(
    selection?.category ?? PROPERTY_CATEGORIES[0]!,
  );
  const [picked, setPicked] = useState<Set<string>>(
    new Set(selection?.subcategories.map((s) => s.id) ?? []),
  );

  const toggle = (sub: PropertySubCategory) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(sub.id)) next.delete(sub.id);
      else next.add(sub.id);
      return next;
    });
  };

  const apply = () => {
    const subs = active.subcategories.filter((s) => picked.has(s.id));
    onChange({ category: active, subcategories: subs });
    close();
  };

  const reset = () => {
    setPicked(new Set());
    onChange(null);
    close();
  };

  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <ul className={styles.categories} role="tablist" aria-orientation="vertical">
          {PROPERTY_CATEGORIES.map((cat) => {
            const isActive = cat.id === active.id;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={cn(styles.category, isActive && styles.categoryActive)}
                  onClick={() => setActive(cat)}
                >
                  <span className={styles.categoryLabel}>{cat.label}</span>
                  <span className={styles.categoryHint}>{cat.description}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.subPane} role="tabpanel">
          <p className={styles.subHeading}>Select one or more types</p>
          <div className={styles.subGrid}>
            {active.subcategories.map((sub) => {
              const isPicked = picked.has(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  className={cn(styles.sub, isPicked && styles.subPicked)}
                  onClick={() => toggle(sub)}
                  aria-pressed={isPicked}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.linkBtn} onClick={reset}>
          Reset
        </button>
        <Button type="button" size="sm" onClick={apply}>
          Apply
        </Button>
      </div>
    </div>
  );
}
