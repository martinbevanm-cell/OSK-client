'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
  createPropertySchema,
  LISTING_KINDS,
  PROPERTY_TYPES,
  type CreatePropertyDto,
  type ListingKind,
  type Property,
  type PropertyType,
} from '@contracts';
import {
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
} from '@/features/properties';
import {
  CountrySelect,
  selectActiveCountry,
  activeCountryChanged,
  useAllowedCountries,
} from '@/features/geo';
import {
  currencyForCountry,
  currencySymbolForCountry,
  findCity,
  getCitiesByCountry,
  getCountry,
} from '@/lib/geoData';
import { toastPushed } from '@/features/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button, MediaUploader, TextField } from '@/components/ui';
import type { UploadedMedia } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { cn } from '@/lib/cn';
import { SubscriptionGate } from './SubscriptionGate';
import styles from './NewListingForm.module.scss';

interface MediaItem {
  url: string;
  kind: 'image' | 'video';
}

interface NewListingFormProps {
  /** When provided the form opens in edit mode and pre-fills with this property. */
  initialProperty?: Property;
}

const TYPE_LABEL: Record<PropertyType, string> = {
  home: 'Homes',
  plot: 'Plots & Land',
  commercial: 'Commercial',
  rental: 'Rentals',
};

const KIND_LABEL: Record<ListingKind, string> = {
  'new-project': 'New Project',
  resale: 'Resale',
};

/** Country centroid fallback when neither the city nor the country has coords. */
const FALLBACK_LOCATION: [number, number] = [-74.0086, 40.7163];

/**
 * Resolve [lng, lat] for a `(country, city)` pair using the bundled
 * `country-state-city` dataset. Falls back to country centroid, then NYC.
 */
function resolveCoords(
  countryIso2: string,
  cityName: string,
): [number, number] {
  const cityMatch = findCity(countryIso2, cityName);
  if (cityMatch && cityMatch.lat != null && cityMatch.lng != null) {
    return [cityMatch.lng, cityMatch.lat];
  }
  const country = getCountry(countryIso2);
  if (country && country.lat !== 0 && country.lng !== 0) {
    return [country.lng, country.lat];
  }
  return FALLBACK_LOCATION;
}

interface FormValues {
  title: string;
  description: string;
  type: PropertyType;
  listingKind: ListingKind;
  price: string;
  bedrooms: string;
  bathrooms: string;
  areaSqft: string;
  locality: string;
  city: string;
  amenitiesRaw: string;
}

export function NewListingForm({ initialProperty }: NewListingFormProps = {}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [createProperty, createState] = useCreatePropertyMutation();
  const [updateProperty, updateState] = useUpdatePropertyMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditMode = !!initialProperty;
  const isLoading = isEditMode ? updateState.isLoading : createState.isLoading;

  /* Country is sourced from the global slice so picking a country on the
   * hero updates the form, and vice-versa. In edit mode we initialise the
   * picker from the existing listing's country. */
  const globalCountry = useAppSelector(selectActiveCountry);
  /* Honour the admin-set country allow-list, if any. */
  const allowedCountries = useAllowedCountries();
  const [country, setCountry] = useState<string>(
    initialProperty?.country ?? globalCountry,
  );

  /* Keep listing-form country in sync with the global slice while
   * we're authoring a new listing (edit mode is owner-of-its-country). */
  useEffect(() => {
    if (!isEditMode) setCountry(globalCountry);
  }, [globalCountry, isEditMode]);

  const setCountryAndShare = (iso2: string) => {
    setCountry(iso2);
    /* Bubble new-listing country up to the global slice so the rest of
     * the app reflects the seller's intent. */
    dispatch(activeCountryChanged(iso2));
  };

  /* Currency + cities derive from the picked country. */
  const currencyCode = useMemo(() => currencyForCountry(country), [country]);
  const currencySymbol = useMemo(
    () => currencySymbolForCountry(country),
    [country],
  );
  const cities = useMemo(() => getCitiesByCountry(country), [country]);

  /* Media is managed outside react-hook-form so the uploader can push
   * updates without going through register/setValue plumbing. */
  const [media, setMedia] = useState<MediaItem[]>(() =>
    (initialProperty?.media ?? [])
      .filter((m) => m.kind === 'image' || m.kind === 'video')
      .map((m) => ({ url: m.url, kind: m.kind as 'image' | 'video' })),
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: initialProperty?.title ?? '',
      description: initialProperty?.description ?? '',
      type: initialProperty?.type ?? 'home',
      listingKind: initialProperty?.listingKind ?? 'resale',
      price: initialProperty ? String(initialProperty.price) : '',
      bedrooms:
        initialProperty?.bedrooms != null
          ? String(initialProperty.bedrooms)
          : '',
      bathrooms:
        initialProperty?.bathrooms != null
          ? String(initialProperty.bathrooms)
          : '',
      areaSqft:
        initialProperty?.areaSqft != null
          ? String(initialProperty.areaSqft)
          : '',
      locality: initialProperty?.locality ?? '',
      city: initialProperty?.city ?? '',
      amenitiesRaw: initialProperty?.amenities?.join(', ') ?? '',
    },
  });

  /* When `initialProperty` arrives after a refetch, sync the form. */
  useEffect(() => {
    if (!initialProperty) return;
    reset({
      title: initialProperty.title,
      description: initialProperty.description,
      type: initialProperty.type,
      listingKind: initialProperty.listingKind,
      price: String(initialProperty.price),
      bedrooms:
        initialProperty.bedrooms != null
          ? String(initialProperty.bedrooms)
          : '',
      bathrooms:
        initialProperty.bathrooms != null
          ? String(initialProperty.bathrooms)
          : '',
      areaSqft:
        initialProperty.areaSqft != null
          ? String(initialProperty.areaSqft)
          : '',
      locality: initialProperty.locality,
      city: initialProperty.city,
      amenitiesRaw: initialProperty.amenities.join(', '),
    });
    setMedia(
      initialProperty.media
        .filter((m) => m.kind === 'image' || m.kind === 'video')
        .map((m) => ({ url: m.url, kind: m.kind as 'image' | 'video' })),
    );
  }, [initialProperty, reset]);

  const watchType = watch('type');

  /* Per-type form behaviour. Single source of truth — change here only. */
  const isResidential = watchType === 'home' || watchType === 'rental';
  const isPlot = watchType === 'plot';
  const isCommercial = watchType === 'commercial';
  const isRental = watchType === 'rental';

  const detailsHeading = isPlot
    ? 'Land details'
    : isCommercial
      ? 'Building details'
      : 'Home details';

  const areaLabel = isPlot
    ? 'Lot size (sq ft)'
    : isCommercial
      ? 'Floor area (sq ft)'
      : 'Living area (sq ft)';

  const areaHint = isPlot
    ? 'Tip: 1 acre = 43,560 sq ft.'
    : isCommercial
      ? 'Rentable area, including common-area allocation.'
      : 'Conditioned interior square footage.';

  const amenitiesPlaceholder = isPlot
    ? 'e.g. Corner lot, Mature oaks, Utilities at road, No HOA'
    : isCommercial
      ? 'e.g. Loading dock, Elevator, Raised flooring, 24/7 access'
      : 'e.g. Doorman, Gym, Roof terrace, Bike storage';

  const priceLabel = isRental
    ? `Monthly rent (${currencyCode})`
    : `Price (${currencyCode})`;
  const pricePlaceholder = isRental
    ? `${currencySymbol}4,500`
    : isPlot
      ? `${currencySymbol}489,000`
      : isCommercial
        ? `${currencySymbol}3,450,000`
        : `${currencySymbol}875,000`;

  const titlePlaceholder = isPlot
    ? '12-Acre Hill Country Parcel — Dripping Springs'
    : isCommercial
      ? 'Grade-A Office Floor — Fulton Market'
      : isRental
        ? '2-Bed Apartment with Bay Views — Pacific Heights'
        : 'Loft Residence at 17 Reade — Tribeca';

  const descriptionPlaceholder = isPlot
    ? 'Acreage, frontage, utilities, zoning, water rights, build-ready status — at least 30 characters.'
    : isCommercial
      ? 'Square footage, build class, ceiling height, parking, loading, prior use — at least 30 characters.'
      : 'Layout, neighborhood, standout features, recent renovations — at least 30 characters.';

  const descriptionHint = isPlot
    ? 'Include acreage, frontage, utilities and zoning.'
    : isCommercial
      ? 'Include floor plate, ceiling height, parking and accessibility.'
      : 'Include neighborhood, layout and standout features.';

  const localityPlaceholder = isPlot
    ? 'Sector or area name'
    : isCommercial
      ? 'Submarket — e.g. Fulton Market'
      : 'Tribeca';

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);

    /* Coerce string-form fields to the API payload shape. */
    const payload: Partial<CreatePropertyDto> = {
      title: values.title.trim(),
      description: values.description.trim(),
      type: values.type,
      listingKind: values.listingKind,
      price: Number(values.price),
      currency: currencyCode,
      country,
      locality: values.locality.trim(),
      city: values.city.trim(),
      amenities: values.amenitiesRaw
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      location: {
        type: 'Point',
        coordinates: resolveCoords(country, values.city),
      },
    };
    /* Only residential listings carry beds/baths — drop stale values if the
     * user filled them in then switched to a Plot or Commercial. */
    if (isResidential && values.bedrooms) {
      payload.bedrooms = Number(values.bedrooms);
    }
    if (isResidential && values.bathrooms) {
      payload.bathrooms = Number(values.bathrooms);
    }
    if (values.areaSqft) payload.areaSqft = Number(values.areaSqft);
    if (media.length > 0) payload.media = media;

    const parsed = createPropertySchema.safeParse(payload);
    if (!parsed.success) {
      setSubmitError(
        parsed.error.issues[0]?.message ?? 'Please review the form.',
      );
      return;
    }

    try {
      if (isEditMode && initialProperty) {
        await updateProperty({
          id: initialProperty.id,
          body: parsed.data,
        }).unwrap();
        dispatch(toastPushed('success', 'Listing updated.'));
      } else {
        await createProperty(parsed.data).unwrap();
        dispatch(
          toastPushed(
            'success',
            'Listing created as a draft — ready when you want to submit it.',
          ),
        );
      }
      router.push('/dashboard/listings');
    } catch (err) {
      /* failure toast handled globally; show inline as well. */
      /* Subscription gate: backend throws 403 with a plan-related message
       * when the seller has no active plan or hit the submissions cap.
       * Route them straight to the pricing page rather than blame the
       * form. We sniff the error shape rtkq surfaces here. */
      const status =
        (err as { status?: unknown })?.status ??
        (err as { originalStatus?: unknown })?.originalStatus;
      const body = (err as { data?: { error?: { message?: string } } })?.data;
      const message = body?.error?.message ?? '';
      if (
        !isEditMode &&
        (status === 403 || /\bplan\b|\bsubscribe\b/i.test(message))
      ) {
        dispatch(
          toastPushed(
            'info',
            message || 'You need an active plan to publish listings.',
          ),
        );
        router.push('/pricing');
        return;
      }
      setSubmitError(
        isEditMode
          ? 'Couldn’t save your changes. Try again in a moment.'
          : 'Couldn’t create the listing. Try again in a moment.',
      );
    }
  };

  return (
    <section className={styles.shell}>
      {/* Subscription nudge — only shows when user has no active plan.
       * The backend will hard-reject submission with a 403 in that
       * case; this card is just a friendly heads-up so they hit the
       * /pricing page before filling the whole form out. Edit mode
       * skips it (existing listings don't trigger the gate). */}
      {!isEditMode ? <SubscriptionGate /> : null}
      <header className={styles.head}>
        <span className={styles.eyebrow}>
          {isEditMode ? 'Edit listing' : 'New listing'}
        </span>
        <h1 className={styles.title}>
          {isEditMode ? 'Edit property' : 'Add a property'}
        </h1>
        <p className={styles.sub}>
          {isEditMode
            ? 'Your changes save right away. Re-submit if the listing needs another review.'
            : 'Saved as a draft — submit when you’re ready and we’ll review it.'}
        </p>
        <Link href="/dashboard/listings" className={styles.back}>
          ← Back to listings
        </Link>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit) as (e: FormEvent) => void}
        noValidate
      >
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Basics</legend>
          <div className={styles.grid}>
            <TextField
              label="Listing title"
              placeholder={titlePlaceholder}
              {...register('title', { required: true, minLength: 6 })}
              error={errors.title ? 'At least 6 characters.' : undefined}
            />
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Description</span>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder={descriptionPlaceholder}
                {...register('description', { required: true, minLength: 30 })}
              />
              {errors.description ? (
                <span className={styles.fieldError}>
                  At least 30 characters.
                </span>
              ) : (
                <span className={styles.fieldHint}>Hint: {descriptionHint}</span>
              )}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Property type</span>
              <select
                className={styles.select}
                {...register('type', { required: true })}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Listing kind</span>
              <select
                className={styles.select}
                {...register('listingKind', { required: true })}
              >
                {LISTING_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label={priceLabel}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={pricePlaceholder}
              {...register('price', { required: true })}
              error={errors.price ? 'Enter a price.' : undefined}
            />
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>{detailsHeading}</legend>
          <div className={styles.grid}>
            {isResidential ? (
              <>
                <TextField
                  label="Bedrooms"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="e.g. 3"
                  {...register('bedrooms')}
                />
                <TextField
                  label="Bathrooms"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="e.g. 2"
                  {...register('bathrooms')}
                />
              </>
            ) : null}
            <TextField
              label={areaLabel}
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={isPlot ? 'e.g. 522720 (12 acres)' : 'e.g. 2400'}
              hint={areaHint}
              {...register('areaSqft')}
            />
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Location</legend>
          <div className={styles.grid}>
            <CountrySelect
              label="Country"
              value={country}
              onChange={setCountryAndShare}
              allowedIso2={allowedCountries}
            />
            <TextField
              label="Locality / neighborhood"
              placeholder={localityPlaceholder}
              {...register('locality', { required: true, minLength: 2 })}
              error={errors.locality ? 'Required.' : undefined}
            />
            <label className={styles.field}>
              <span className={styles.fieldLabel}>City</span>
              <input
                list="osk-city-list"
                className={styles.input}
                placeholder={
                  cities.length > 0
                    ? `Start typing — e.g. ${cities[0]?.name ?? 'a city'}`
                    : 'Type the city name'
                }
                {...register('city', { required: true, minLength: 2 })}
              />
              <datalist id="osk-city-list">
                {/* Cap to a reasonable count — the datalist is a hint, not a hard list. */}
                {cities.slice(0, 500).map((c) => (
                  <option key={c.key} value={c.name}>
                    {c.stateCode ? `${c.name}, ${c.stateCode}` : c.name}
                  </option>
                ))}
              </datalist>
              {errors.city ? (
                <span className={styles.fieldError}>Required.</span>
              ) : (
                <span className={styles.fieldHint}>
                  We&rsquo;ll pin the listing to this city on the map. Pricing
                  is in {currencyCode}.
                </span>
              )}
            </label>
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Photos &amp; video</legend>
          <MediaUploader
            accept="both"
            multiple
            label="Drop photos or a video, or browse"
            hint="JPG / PNG / WebP up to 12 MB, MP4 / WebM up to 150 MB. First image becomes the cover."
            disabled={media.length >= 20}
            onUploaded={(uploaded: UploadedMedia[]) =>
              setMedia((prev) => [
                ...prev,
                ...uploaded.map((u) => ({ url: u.url, kind: u.kind })),
              ])
            }
          />
          {media.length > 0 ? (
            <ul className={styles.mediaGrid}>
              {media.map((m, i) => (
                <li
                  key={`${m.url}-${i}`}
                  className={styles.mediaTile}
                >
                  {m.kind === 'video' ? (
                    <video
                      src={resolveMediaUrl(m.url)}
                      className={styles.mediaPreview}
                      muted
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(m.url)}
                      alt={`Listing media ${i + 1}`}
                      className={styles.mediaPreview}
                    />
                  )}
                  {i === 0 ? (
                    <span className={styles.mediaCover}>Cover</span>
                  ) : null}
                  <button
                    type="button"
                    className={styles.mediaRemove}
                    onClick={() =>
                      setMedia((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    aria-label="Remove media"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Amenities</legend>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Comma-separated</span>
            <input
              className={styles.input}
              placeholder={amenitiesPlaceholder}
              {...register('amenitiesRaw')}
            />
            <span className={styles.fieldHint}>
              Optional — separate items with commas. We&rsquo;ll render each as
              a chip.
            </span>
          </label>
        </fieldset>

        {submitError ? (
          <p className={styles.formError} role="alert">
            {submitError}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading
              ? 'Saving…'
              : isEditMode
                ? 'Save changes'
                : 'Create listing'}
          </Button>
          <Link href="/dashboard/listings" className={cn(styles.ghost)}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
