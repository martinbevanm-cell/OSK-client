'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inquirySchema, type InquiryDto } from '@contracts';
import { useSubmitInquiryMutation } from '@/features/contact';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import styles from './ContactChannels.module.scss';

interface InquiryFormProps {
  propertyId: string;
  onDone?: () => void;
}

/**
 * Email channel — posts to the secure relay (POST /contact/inquiry).
 * The owner's real email is never exposed to the client.
 */
export function InquiryForm({ propertyId, onDone }: InquiryFormProps) {
  const dispatch = useAppDispatch();
  const [submitInquiry, { isLoading }] = useSubmitInquiryMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryDto>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      propertyId,
      name: '',
      email: '',
      message: '',
      consent: true,
      // The real CAPTCHA widget (hCaptcha / Turnstile) sets this token.
      captchaToken: 'dev-captcha-token',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitInquiry(values).unwrap();
      dispatch(toastPushed('success', 'Message sent — the owner will be in touch.'));
      reset();
      onDone?.();
    } catch {
      /* failure toast is raised globally by the listener middleware */
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <input type="hidden" {...register('propertyId')} />
      <input type="hidden" {...register('captchaToken')} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="iq-name">
          Name
        </label>
        <input id="iq-name" className={styles.input} {...register('name')} />
        {errors.name && <span className={styles.error}>{errors.name.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="iq-email">
          Email
        </label>
        <input
          id="iq-email"
          type="email"
          className={styles.input}
          {...register('email')}
        />
        {errors.email && <span className={styles.error}>{errors.email.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="iq-phone">
          Phone <span>(optional)</span>
        </label>
        <input id="iq-phone" className={styles.input} {...register('phone')} />
        {errors.phone && <span className={styles.error}>{errors.phone.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="iq-message">
          Message
        </label>
        <textarea
          id="iq-message"
          className={styles.textarea}
          placeholder="Is this property still available?"
          {...register('message')}
        />
        {errors.message && <span className={styles.error}>{errors.message.message}</span>}
      </div>

      <div className={styles.captcha}>Spam protection (CAPTCHA) mounts here</div>

      <label className={styles.consent}>
        <input type="checkbox" {...register('consent')} />
        <span>I agree to be contacted about this property.</span>
      </label>
      {errors.consent && <span className={styles.error}>{errors.consent.message}</span>}

      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
