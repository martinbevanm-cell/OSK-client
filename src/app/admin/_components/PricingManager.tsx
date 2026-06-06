'use client';

import { useMemo, useState } from 'react';
import {
  PROPERTY_TYPES,
  type PlanListingKind,
  type PlanPropertyType,
  type PricingPlan,
} from '@contracts';
import { ProviderCredentialsManager } from './ProviderCredentialsManager';
import {
  useCreatePricingPlanMutation,
  useDeletePricingPlanMutation,
  useGetPaymentSettingsQuery,
  useListPricingPlansQuery,
  useUpdatePaymentSettingsMutation,
  useUpdatePricingPlanMutation,
} from '@/features/pricing';
import { CountrySelect } from '@/features/geo';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button, TextField } from '@/components/ui';
import { currencyForCountry, getCountry } from '@/lib/geoData';
import { cn } from '@/lib/cn';
import styles from './PricingManager.module.scss';

/** A blank plan used when the admin opens the "Add plan" form. */
const BLANK_PLAN: Omit<PricingPlan, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  propertyType: '*',
  listingKind: '*',
  country: '*',
  featured: false,
  price: 0,
  currency: 'USD',
  priority: 0,
  active: true,
};

type Draft = typeof BLANK_PLAN;

/** Pricing admin — global toggle + provider config + plans matrix. */
export function PricingManager() {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading: settingsLoading } = useGetPaymentSettingsQuery();
  const { data: plans, isLoading: plansLoading, isError } = useListPricingPlansQuery();
  const [updateSettings, { isLoading: savingSettings }] =
    useUpdatePaymentSettingsMutation();
  const [createPlan, { isLoading: creating }] = useCreatePricingPlanMutation();
  const [updatePlan] = useUpdatePricingPlanMutation();
  const [deletePlan] = useDeletePricingPlanMutation();

  const [draft, setDraft] = useState<Draft>(BLANK_PLAN);
  const [showForm, setShowForm] = useState(false);

  const sortedPlans = useMemo(() => plans ?? [], [plans]);

  const setSetting = async <K extends 'paymentsEnabled' | 'bankInstructions'>(
    key: K,
    value: K extends 'paymentsEnabled' ? boolean : string,
  ) => {
    try {
      await updateSettings({ [key]: value }).unwrap();
    } catch {
      /* surfaced by the global toast */
    }
  };

  /* Provider enable/disable + credentials editing now lives inside
   * `ProviderCredentialsManager` — it shares the same updateSettings
   * mutation under the hood so toggle changes invalidate the cache
   * just the same. */

  /* When the admin picks a country in the draft form, default the
   * currency to that country's currency so they don't have to think. */
  const onDraftCountry = (iso2: string) => {
    setDraft((d) => ({
      ...d,
      country: iso2,
      currency: currencyForCountry(iso2),
    }));
  };

  const onSubmitDraft = async () => {
    if (draft.name.trim().length < 2) {
      dispatch(toastPushed('error', 'Plan name is too short.'));
      return;
    }
    try {
      await createPlan({
        ...draft,
        name: draft.name.trim(),
      }).unwrap();
      dispatch(toastPushed('success', `Plan "${draft.name}" created.`));
      setDraft(BLANK_PLAN);
      setShowForm(false);
    } catch {
      /* surfaced by the global toast */
    }
  };

  const onTogglePlanActive = async (plan: PricingPlan) => {
    try {
      await updatePlan({
        id: plan.id,
        body: { active: !plan.active },
      }).unwrap();
    } catch {
      /* surfaced by the global toast */
    }
  };

  const onDeletePlan = async (plan: PricingPlan) => {
    if (!confirm(`Delete plan "${plan.name}"? This can't be undone.`)) return;
    try {
      await deletePlan(plan.id).unwrap();
      dispatch(toastPushed('success', `Deleted "${plan.name}".`));
    } catch {
      /* surfaced by the global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Pricing</span>
        <h1 className={styles.title}>Pricing &amp; payments</h1>
        <p className={styles.sub}>
          Toggle paid listings on or off, pick which payment methods sellers can use, and
          write the pricing matrix. Plans match by axis — a plan with a specific value
          wins over a wildcard, so you can keep a broad fallback and stack precise rules
          on top.
        </p>
      </header>

      {/* ─── Global toggle card ─────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Global payments</h2>
          <p className={styles.cardSub}>
            Master switch. Off means every approval publishes for free, regardless of any
            plan price.
          </p>
        </header>
        {settingsLoading ? (
          <p className={styles.muted}>Loading…</p>
        ) : settings ? (
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.paymentsEnabled}
                disabled={savingSettings}
                onChange={(e) => setSetting('paymentsEnabled', e.currentTarget.checked)}
              />
              <span className={styles.toggleSlider} aria-hidden="true" />
              <span className={styles.toggleLabel}>
                Charge sellers for approved listings
              </span>
            </label>
            <span
              className={cn(
                styles.statusPill,
                settings.paymentsEnabled ? styles.statusOn : styles.statusOff,
              )}
            >
              {settings.paymentsEnabled ? 'PAID' : 'FREE'}
            </span>
          </div>
        ) : null}
      </section>

      {/* ─── Provider credentials + enable/disable ──────────────────── */}
      {settings ? <ProviderCredentialsManager settings={settings} /> : null}

      {/* ─── Bank instructions ─────────────────────────────────────── */}
      {settings?.enabledProviders.includes('bank-transfer') ? (
        <section className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Bank transfer instructions</h2>
            <p className={styles.cardSub}>
              Shown on the seller&apos;s checkout when they pick &ldquo;Bank
              transfer&rdquo;. Include the IBAN/SWIFT, beneficiary, and the note they
              should put in the reference line.
            </p>
          </header>
          <textarea
            className={styles.textarea}
            rows={6}
            defaultValue={settings.bankInstructions}
            onBlur={(e) => setSetting('bankInstructions', e.currentTarget.value)}
            placeholder={[
              'Beneficiary: OSK Real Estate Escrow Ltd.',
              'Bank: North Atlantic Bank',
              'Account number: 0012457789',
              'IBAN: GB82NATB20481200124577',
              'SWIFT/BIC: NATBGB2L',
              'Reference: Use your listing title or property slug',
            ].join('\n')}
          />
        </section>
      ) : null}

      {/* ─── Plans matrix ──────────────────────────────────────────── */}
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <div>
            <h2 className={styles.cardTitle}>Pricing plans</h2>
            <p className={styles.cardSub}>
              Each plan declares the price for one slice of inventory. Use{' '}
              <code className={styles.code}>*</code> as a wildcard to match any value on
              an axis. Higher <em>priority</em> wins ties.
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close' : 'Add plan'}
          </Button>
        </header>

        {showForm ? (
          <div className={styles.form}>
            <div className={styles.formGrid}>
              <TextField
                label="Name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Standard Home — US"
              />
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Property type</span>
                <select
                  className={styles.select}
                  value={draft.propertyType}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      propertyType: e.target.value as PlanPropertyType,
                    }))
                  }
                >
                  <option value="*">Any</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Listing kind</span>
                <select
                  className={styles.select}
                  value={draft.listingKind}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      listingKind: e.target.value as PlanListingKind,
                    }))
                  }
                >
                  <option value="*">Any</option>
                  <option value="resale">Resale</option>
                  <option value="new-project">New project</option>
                </select>
              </label>
              <div>
                <span className={styles.fieldLabel}>Country</span>
                {draft.country === '*' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onDraftCountry('US')}
                  >
                    Set country
                  </Button>
                ) : (
                  <div className={styles.countryRow}>
                    <CountrySelect
                      value={draft.country}
                      onChange={onDraftCountry}
                      variant="ghost"
                      hideLabel
                    />
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setDraft((d) => ({ ...d, country: '*' }))}
                    >
                      Any country
                    </button>
                  </div>
                )}
              </div>
              <TextField
                label="Price"
                type="number"
                min={0}
                value={String(draft.price)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    price: Number(e.target.value) || 0,
                  }))
                }
              />
              <TextField
                label="Currency"
                value={draft.currency}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    currency: e.target.value.toUpperCase(),
                  }))
                }
                maxLength={3}
              />
              <TextField
                label="Priority"
                type="number"
                value={String(draft.priority)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    priority: Number(e.target.value) || 0,
                  }))
                }
                hint="Higher wins when multiple plans match."
              />
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDraft((d) => ({
                      ...d,
                      featured: checked,
                    }));
                  }}
                />
                <span>Featured-upgrade price (add-on)</span>
              </label>
            </div>
            <div className={styles.formActions}>
              <Button type="button" onClick={onSubmitDraft} disabled={creating}>
                {creating ? 'Saving…' : 'Create plan'}
              </Button>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => {
                  setDraft(BLANK_PLAN);
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {plansLoading ? (
          <p className={styles.muted}>Loading plans…</p>
        ) : isError ? (
          <p className={styles.muted}>Couldn&rsquo;t load plans.</p>
        ) : sortedPlans.length === 0 ? (
          <p className={styles.muted}>
            No plans yet — add one above to start charging for that slice of inventory.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Type</th>
                  <th>Kind</th>
                  <th>Country</th>
                  <th>Tier</th>
                  <th>Price</th>
                  <th>Priority</th>
                  <th>State</th>
                  <th aria-label="Row actions" />
                </tr>
              </thead>
              <tbody>
                {sortedPlans.map((plan) => {
                  const country =
                    plan.country === '*'
                      ? 'Any'
                      : `${getCountry(plan.country)?.flag ?? ''} ${plan.country}`;
                  return (
                    <tr key={plan.id}>
                      <td>{plan.name}</td>
                      <td>{plan.propertyType === '*' ? 'Any' : plan.propertyType}</td>
                      <td>{plan.listingKind === '*' ? 'Any' : plan.listingKind}</td>
                      <td>{country}</td>
                      <td>{plan.featured ? 'Featured' : 'Base'}</td>
                      <td>
                        <strong>
                          {plan.price.toLocaleString('en-US')} {plan.currency}
                        </strong>
                      </td>
                      <td>{plan.priority}</td>
                      <td>
                        <span
                          className={cn(
                            styles.statusPill,
                            plan.active ? styles.statusOn : styles.statusOff,
                          )}
                        >
                          {plan.active ? 'ACTIVE' : 'OFF'}
                        </span>
                      </td>
                      <td className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => onTogglePlanActive(plan)}
                        >
                          {plan.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          className={styles.linkDanger}
                          onClick={() => onDeletePlan(plan)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
