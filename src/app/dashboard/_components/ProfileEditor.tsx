'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileDto } from '@contracts';
import { z } from 'zod';
import { useGetMeQuery, useUpdateMeMutation } from '@/features/users';
import { CountrySelectPanel } from '@/features/geo';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button, MediaUploader, TextField } from '@/components/ui';
import type { UploadedMedia } from '@/components/ui';
import { CitySelectPanel, FilterDropdown } from '@/components/home/filters';
import { CityIcon, GlobeIcon } from '@/components/home/HeroIcons';
import { findCity, getCountries, getCountry, type CityOption } from '@/lib/geoData';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import styles from './ProfileEditor.module.scss';

const profileEditorSchema = updateProfileSchema.extend({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  phone: z.string().trim().min(6, 'Phone is too short').max(40),
  address: z.string().trim().min(3, 'Address is too short').max(240),
  city: z.string().trim().min(2, 'City is too short').max(80),
  state: z.string().trim().min(2, 'State is too short').max(80),
  country: z.string().trim().min(2, 'Country is too short').max(80),
  companyName: z.string().trim().min(2).max(120).optional().or(z.literal('')),
  companyRegistration: z.string().trim().min(2).max(120).optional().or(z.literal('')),
});

type ProfileEditorValues = z.infer<typeof profileEditorSchema>;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileEditor() {
  const dispatch = useAppDispatch();
  const { data: me, isLoading, isError } = useGetMeQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [success, setSuccess] = useState(false);
  const [countryIso2, setCountryIso2] = useState('US');
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);

  const countries = useMemo(() => getCountries(), []);

  /* Avatar is tracked outside react-hook-form so the MediaUploader can drive
   * it without re-renders fighting the form's controlled inputs. */
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarDirty, setAvatarDirty] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileEditorValues>({
    resolver: zodResolver(profileEditorSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      companyName: '',
      companyRegistration: '',
    },
  });

  const watchedCountry = watch('country') ?? '';
  const watchedCity = watch('city') ?? '';
  const watchedPhone = watch('phone') ?? '';
  const watchedAddress = watch('address') ?? '';
  const watchedState = watch('state') ?? '';
  const watchedName = watch('name') ?? '';

  const countryNameByIso = useMemo(
    () => new Map(countries.map((c) => [c.iso2, c.name])),
    [countries],
  );
  const countryIsoByName = useMemo(
    () => new Map(countries.map((c) => [c.name.trim().toLowerCase(), c.iso2])),
    [countries],
  );

  const completionChecklist = useMemo(
    () => [
      { label: 'Full name', value: watchedName },
      { label: 'Phone', value: watchedPhone },
      { label: 'Country', value: watchedCountry },
      { label: 'State / Region', value: watchedState },
      { label: 'City', value: watchedCity },
      { label: 'Address', value: watchedAddress },
    ],
    [
      watchedName,
      watchedPhone,
      watchedCountry,
      watchedState,
      watchedCity,
      watchedAddress,
    ],
  );

  const missingFields = useMemo(
    () =>
      completionChecklist.filter((item) => !item.value.trim()).map((item) => item.label),
    [completionChecklist],
  );
  const isProfileComplete = missingFields.length === 0;

  function resolveCountryIso(rawCountry?: string): string {
    const trimmed = rawCountry?.trim();
    if (!trimmed) return 'US';
    if (trimmed.length === 2) {
      const iso2 = trimmed.toUpperCase();
      return getCountry(iso2) ? iso2 : 'US';
    }
    return countryIsoByName.get(trimmed.toLowerCase()) ?? 'US';
  }

  /* Sync form + avatar state when the profile loads. */
  useEffect(() => {
    if (me) {
      const iso2 = resolveCountryIso(me.country);
      const countryName = countryNameByIso.get(iso2) ?? me.country ?? '';
      const resolvedCity = me.city ? (findCity(iso2, me.city) ?? null) : null;

      reset({
        name: me.name,
        avatarUrl: me.avatarUrl ?? '',
        phone: me.phone ?? '',
        address: me.address ?? '',
        city: resolvedCity?.name ?? me.city ?? '',
        state: me.state ?? '',
        country: countryName,
        companyName: me.companyName ?? '',
        companyRegistration: me.companyRegistration ?? '',
      });

      setCountryIso2(iso2);
      setSelectedCity(resolvedCity);
      setAvatarUrl(me.avatarUrl ?? '');
      setAvatarDirty(false);
    }
  }, [countryIsoByName, countryNameByIso, me, reset]);

  const onSubmit = async (values: ProfileEditorValues) => {
    try {
      await updateMe({ ...values, avatarUrl: avatarUrl || undefined }).unwrap();
      setSuccess(true);
      setAvatarDirty(false);
      dispatch(toastPushed('success', 'Profile saved.'));
      window.setTimeout(() => setSuccess(false), 2500);
    } catch {
      /* surfaced by the global toast */
    }
  };

  const onAvatarUploaded = (uploaded: UploadedMedia[]) => {
    const first = uploaded[0];
    if (!first) return;
    setAvatarUrl(first.url);
    setAvatarDirty(true);
    dispatch(toastPushed('success', 'Avatar uploaded — save to apply.'));
  };

  const removeAvatar = () => {
    if (!avatarUrl) return;
    setAvatarUrl('');
    setAvatarDirty(true);
  };

  const canSave = !saving && (isDirty || avatarDirty);
  const currentCountry = getCountry(countryIso2);
  const countryLabel = currentCountry
    ? `${currentCountry.flag ?? ''} ${currentCountry.name}`.trim()
    : watchedCountry || 'Select country';
  const cityLabel = selectedCity
    ? selectedCity.stateCode
      ? `${selectedCity.name}, ${selectedCity.stateCode}`
      : selectedCity.name
    : watchedCity || 'Select city';

  const onCountryChanged = (iso2: string) => {
    setCountryIso2(iso2);
    setSelectedCity(null);
    // Reset city when country changes, but don't validate immediately.
    setValue('city', '', { shouldDirty: true, shouldValidate: false });
    setValue('country', countryNameByIso.get(iso2) ?? iso2, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onCityChanged = (city: CityOption | null) => {
    setSelectedCity(city);
    setValue('city', city?.name ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Account</span>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.sub}>
          Update how your name and avatar appear across listings and inquiries.
        </p>
      </header>

      <div className={styles.card}>
        {isLoading ? (
          <p className={styles.muted}>Loading…</p>
        ) : isError || !me ? (
          <p className={styles.muted}>Couldn&rsquo;t load your profile.</p>
        ) : (
          <form
            className={styles.form}
            onSubmit={handleSubmit(onSubmit) as (e: FormEvent) => void}
            noValidate
          >
            <div className={styles.identity}>
              <span className={styles.avatar} aria-hidden="true">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(avatarUrl)} alt="" />
                ) : (
                  initials(me.name)
                )}
              </span>
              <div className={styles.identityCopy}>
                <p className={styles.identityName}>{me.name}</p>
                <p className={styles.identityRole}>
                  {me.email} · {me.role}
                </p>
                {avatarUrl ? (
                  <button
                    type="button"
                    className={styles.removeAvatar}
                    onClick={removeAvatar}
                  >
                    Remove avatar
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className={isProfileComplete ? styles.completeCard : styles.incompleteCard}
              role="status"
              aria-live="polite"
            >
              <p className={styles.completionTitle}>
                {isProfileComplete
                  ? 'Profile completed'
                  : `Complete your profile (${missingFields.length} missing)`}
              </p>
              {isProfileComplete ? (
                <>
                  <p className={styles.completionText}>
                    Your contact and company details are complete.
                  </p>
                  {me && !me.emailVerified ? (
                    <p className={styles.completionTextWarning}>
                      ⚠ Your email is not yet verified — check the banner above to resend
                      the link.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className={styles.completionText}>
                  Please add: {missingFields.join(', ')}.
                </p>
              )}
            </div>

            <div className={styles.uploadField}>
              <span className={styles.uploadLabel}>Avatar</span>
              <MediaUploader
                accept="image"
                multiple={false}
                label="Drop a photo or click to browse"
                hint="JPG, PNG, WEBP or AVIF — at least 200×200 px."
                onUploaded={onAvatarUploaded}
              />
            </div>

            <TextField
              label="Full name"
              autoComplete="name"
              required
              {...register('name')}
              error={errors.name?.message}
            />

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact details</h2>
              <div className={styles.grid}>
                <TextField
                  label="Phone"
                  autoComplete="tel"
                  placeholder="+1 365 955 7829"
                  required
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <div className={styles.dropdownField}>
                  <FilterDropdown
                    label="Country"
                    value={countryLabel}
                    active={!!watchedCountry.trim()}
                    icon={<GlobeIcon />}
                    panelWidth="22rem"
                    error={errors.country?.message}
                  >
                    {(close) => (
                      <CountrySelectPanel
                        selected={countryIso2}
                        onChange={onCountryChanged}
                        close={close}
                      />
                    )}
                  </FilterDropdown>
                </div>
                <TextField
                  label="State / Region"
                  autoComplete="address-level1"
                  placeholder="Ontario"
                  required
                  {...register('state')}
                  error={errors.state?.message}
                />
                <div className={styles.dropdownField}>
                  <FilterDropdown
                    label="City"
                    value={cityLabel}
                    active={!!watchedCity.trim()}
                    icon={<CityIcon />}
                    error={errors.city?.message}
                  >
                    {(close) => (
                      <CitySelectPanel
                        countryIso2={countryIso2}
                        selected={selectedCity}
                        onChange={onCityChanged}
                        close={close}
                      />
                    )}
                  </FilterDropdown>
                </div>
              </div>
              <TextField
                label="Address"
                autoComplete="street-address"
                placeholder="101 Catherine Street, 6th Floor"
                required
                {...register('address')}
                error={errors.address?.message}
              />
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Company details</h2>
              <div className={styles.grid}>
                <TextField
                  label="Company name"
                  autoComplete="organization"
                  placeholder="OSK Real Estate"
                  {...register('companyName')}
                  error={errors.companyName?.message}
                />
                <TextField
                  label="Company registration"
                  placeholder="CA-REG-184220"
                  {...register('companyRegistration')}
                  error={errors.companyRegistration?.message}
                />
              </div>
            </div>

            {/* Keep avatarUrl in the form so server-side validation messages
             * surface if the URL is ever rejected. */}
            <input type="hidden" value={avatarUrl} {...register('avatarUrl')} />
            <input type="hidden" {...register('country')} />
            <input type="hidden" {...register('city')} />

            <div className={styles.actions}>
              <Button type="submit" size="lg" disabled={!canSave}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {success ? (
                <span className={styles.ok} role="status">
                  Saved
                </span>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
