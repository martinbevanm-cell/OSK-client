import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Badge.module.scss';

export type BadgeTone = 'new' | 'resale' | 'featured' | 'sold';

export interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Status badge — tone maps directly to the badge-* theme tokens. */
export function Badge({ tone, children, className }: BadgeProps) {
  return <span className={cn(styles.badge, styles[tone], className)}>{children}</span>;
}
