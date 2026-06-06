import Link from 'next/link';
import { Button } from '@/components/ui';
import styles from './Placeholder.module.scss';

interface PlaceholderProps {
  title: string;
  description: string;
  /** Roadmap phase this surface is scheduled for. */
  phase?: string;
}

/** Honest "scaffolded, not yet built" surface for routes pending a later sprint. */
export function Placeholder({ title, description, phase }: PlaceholderProps) {
  return (
    <div className={styles.root}>
      {phase && <span className={styles.phase}>{phase}</span>}
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <Link href="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </div>
  );
}
