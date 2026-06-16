'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inquirySchema, type InquiryDto } from '@contracts';
import { useSubmitInquiryMutation } from '@/features/contact';
import { SignupCaptcha, useGetCaptchaConfigQuery } from '@/features/captcha';
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
  /* Captcha state — same shape as the auth forms. When the admin
   * disables captcha, `captchaRequired` is false and the field
   * passes through unset; the backend's verifyToken short-circuits
   * to success in that case. */
  const { data: captchaConfig } = useGetCaptchaConfigQuery();
  const captchaRequired = Boolean(
    captchaConfig?.enabled && captchaConfig.provider !== 'none',
  );
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaMissing, setCaptchaMissing] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InquiryDto>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      propertyId,
      name: '',
      email: '',
      message: '',
      consent: true,
      /* Filled by the real captcha widget below. The contract demands
       * a non-empty string when captcha is enabled — we set this from
       * the widget callback before submit. */
      captchaToken: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (captchaRequired && !captchaToken) {
      setCaptchaMissing(true);
      return;
    }
    setCaptchaMissing(false);
    try {
      await submitInquiry({
        ...values,
        captchaToken: captchaRequired ? captchaToken : 'disabled',
      }).unwrap();
      dispatch(toastPushed('success', 'Message sent — the owner will be in touch.'));
      reset();
      setCaptchaToken('');
      setCaptchaResetKey((n) => n + 1);
      onDone?.();
    } catch {
      /* failure toast is raised globally by the listener middleware */
      setCaptchaToken('');
      setCaptchaResetKey((n) => n + 1);
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

      {captchaRequired ? (
        <SignupCaptcha
          resetKey={captchaResetKey}
          onToken={(token) => {
            setCaptchaToken(token);
            /* Keep RHF's hidden field aligned so the schema validator
             *  passes — the contract demands a non-empty string. */
            setValue('captchaToken', token || '');
            if (token) setCaptchaMissing(false);
          }}
        />
      ) : null}
      {captchaMissing ? (
        <span className={styles.error}>Please complete the captcha to continue.</span>
      ) : null}

      <label className={styles.consent}>
        <input type="checkbox" {...register('consent')} />
        <span>I agree to be contacted about this property.</span>
      </label>
      {errors.consent && <span className={styles.error}>{errors.consent.message}</span>}

      <Button
        type="submit"
        disabled={isLoading || (captchaRequired && !captchaToken)}
        fullWidth
      >
        {isLoading ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
