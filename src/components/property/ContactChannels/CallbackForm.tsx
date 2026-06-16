'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { callbackRequestSchema, type CallbackRequestDto } from '@contracts';
import { useRequestCallbackMutation } from '@/features/contact';
import { SignupCaptcha, useGetCaptchaConfigQuery } from '@/features/captcha';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui';
import styles from './ContactChannels.module.scss';

const TIME_SLOTS = [
  'Morning (9am – 12pm)',
  'Afternoon (12pm – 4pm)',
  'Evening (4pm – 8pm)',
] as const;

interface CallbackFormProps {
  propertyId: string;
  onDone?: () => void;
}

/**
 * Call channel — request-a-callback flow. Captures preferred time slots so
 * the owner/agent can return the call without the client's number being
 * exposed to anyone else.
 */
export function CallbackForm({ propertyId, onDone }: CallbackFormProps) {
  const dispatch = useAppDispatch();
  const [requestCallback, { isLoading }] = useRequestCallbackMutation();
  /* Captcha state — same shape as the inquiry form. */
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
  } = useForm<CallbackRequestDto>({
    resolver: zodResolver(callbackRequestSchema),
    defaultValues: {
      propertyId,
      name: '',
      phone: '',
      slots: [],
      consent: true,
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
      await requestCallback({
        ...values,
        captchaToken: captchaRequired ? captchaToken : 'disabled',
      }).unwrap();
      dispatch(toastPushed('success', 'Callback requested — expect a call soon.'));
      reset();
      setCaptchaToken('');
      setCaptchaResetKey((n) => n + 1);
      onDone?.();
    } catch {
      /* failure toast raised globally by the listener middleware */
      setCaptchaToken('');
      setCaptchaResetKey((n) => n + 1);
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <input type="hidden" {...register('propertyId')} />
      <input type="hidden" {...register('captchaToken')} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cb-name">
          Name
        </label>
        <input id="cb-name" className={styles.input} {...register('name')} />
        {errors.name && <span className={styles.error}>{errors.name.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cb-phone">
          Phone
        </label>
        <input id="cb-phone" className={styles.input} {...register('phone')} />
        {errors.phone && <span className={styles.error}>{errors.phone.message}</span>}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Preferred time</span>
        {TIME_SLOTS.map((slot) => (
          <label key={slot} className={styles.consent}>
            <input type="checkbox" value={slot} {...register('slots')} />
            <span>{slot}</span>
          </label>
        ))}
        {errors.slots && <span className={styles.error}>{errors.slots.message}</span>}
      </div>

      {captchaRequired ? (
        <SignupCaptcha
          resetKey={captchaResetKey}
          onToken={(token) => {
            setCaptchaToken(token);
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
        {isLoading ? 'Requesting…' : 'Request callback'}
      </Button>
    </form>
  );
}
