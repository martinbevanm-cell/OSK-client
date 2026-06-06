'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Button, TextField } from '@/components/ui';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { SITE_CONTACT } from '@/lib/siteContact';
import styles from './ContactForm.module.scss';

const TOPICS = [
  'General inquiry',
  'Sales',
  'Support',
  'Press',
  'Partnerships',
] as const;
type Topic = (typeof TOPICS)[number];

const formSchema = z.object({
  name: z.string().min(2, 'Please enter your full name.').max(80),
  email: z.string().email('Please enter a valid email.'),
  topic: z.enum(TOPICS),
  message: z
    .string()
    .min(20, 'Tell us a little more — at least 20 characters.')
    .max(2000),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm consent to contact you.' }),
  }),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof formSchema>, string>>;

/**
 * Public contact form. Mirrors the inquiry-form pattern but posts to a
 * generic relay; for now it validates client-side and acknowledges with a
 * toast. Wire to /contact/general or similar once the backend route ships.
 */
export function ContactForm() {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<Topic>('General inquiry');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = formSchema.safeParse({ name, email, topic, message, consent });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);

    // TODO(backend): POST /contact/general once the route ships.
    await new Promise((r) => setTimeout(r, 600));

    dispatch(
      toastPushed(
        'success',
        'Thanks — we’ll be in touch within one business day.',
      ),
    );
    setName('');
    setEmail('');
    setTopic('General inquiry');
    setMessage('');
    setConsent(false);
    setSubmitting(false);
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.grid}>
        <TextField
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={80}
          required
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
      </div>

      <label className={styles.field}>
        <span className={styles.label}>What can we help with?</span>
        <select
          className={styles.select}
          value={topic}
          onChange={(e) => setTopic(e.target.value as Topic)}
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Message</span>
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="A few sentences is fine."
          maxLength={2000}
        />
        {errors.message ? (
          <span className={styles.fieldError} role="alert">
            {errors.message}
          </span>
        ) : null}
      </label>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I agree to be contacted about my inquiry. We won’t share your
          details — see our{' '}
          <a href="/privacy" className={styles.consentLink}>
            privacy policy
          </a>
          .
        </span>
      </label>
      {errors.consent ? (
        <span className={styles.fieldError} role="alert">
          {errors.consent}
        </span>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send message'}
        </Button>
        <p className={styles.foot}>
          Or email{' '}
          <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>.
        </p>
      </div>
    </form>
  );
}
