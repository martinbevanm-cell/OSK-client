'use client';

import { useState } from 'react';
import {
  FEATURE_KEYS,
  PLAN_INTERVALS,
  type CreateSubscriptionPlanDto,
  type FeatureKey,
  type PlanInterval,
  type SubscriptionPlan,
} from '@contracts';
import {
  useCreateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useListSubscriptionPlansAdminQuery,
  useUpdateSubscriptionPlanMutation,
} from '@/features/subscriptions';
import { useGetPaymentSettingsQuery } from '@/features/pricing';
import { toastPushed } from '@/features/ui';
import { useAppDispatch } from '@/store/hooks';
import { Button, TextField } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './PlansManager.module.scss';

/** Fallback when /pricing/settings hasn't loaded yet — keeps the
 *  editor functional during the first paint. Kept in sync with the
 *  backend BILLING_CURRENCIES constant. */
const DEFAULT_BILLING_CURRENCIES = [
  'USD',
  'CAD',
  'EUR',
  'GBP',
  'AUD',
  'NGN',
  'GHS',
  'ZAR',
  'KES',
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Subscription plans admin.
 *
 *  - Lists every plan (active + inactive) with quick actions
 *  - Create / edit form covering: name, slug, tagline, interval,
 *    highlight flag, sort order, active flag, prices (per currency),
 *    and a features editor (label + included + key + limit)
 * ──────────────────────────────────────────────────────────────────────── */

interface DraftPrice {
  currency: string;
  amount: string; // text in form, converted to number on save
}
interface DraftFeature {
  label: string;
  included: boolean;
  key?: FeatureKey | '';
  limit?: string; // text — '' means none
}

interface Draft {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  interval: PlanInterval;
  highlight: boolean;
  active: boolean;
  sortOrder: number;
  prices: DraftPrice[];
  features: DraftFeature[];
}

const EMPTY_DRAFT: Draft = {
  slug: '',
  name: '',
  tagline: '',
  interval: 'month',
  highlight: false,
  active: true,
  sortOrder: 0,
  prices: [{ currency: 'USD', amount: '0' }],
  features: [],
};

function planToDraft(p: SubscriptionPlan): Draft {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    interval: p.interval,
    highlight: p.highlight,
    active: p.active,
    sortOrder: p.sortOrder,
    prices: p.prices.length
      ? p.prices.map((pr) => ({
          currency: pr.currency,
          amount: String(pr.amount),
        }))
      : [{ currency: 'USD', amount: '0' }],
    features: p.features.map((f) => ({
      label: f.label,
      included: f.included,
      key: f.key ?? '',
      limit: f.limit === undefined || f.limit === null ? '' : String(f.limit),
    })),
  };
}

function draftToDto(d: Draft): CreateSubscriptionPlanDto {
  return {
    slug: d.slug.trim().toLowerCase(),
    name: d.name.trim(),
    tagline: d.tagline.trim(),
    interval: d.interval,
    highlight: d.highlight,
    active: d.active,
    sortOrder: d.sortOrder,
    prices: d.prices
      .filter((p) => p.currency.trim().length === 3)
      .map((p) => ({
        currency: p.currency.toUpperCase(),
        amount: Math.max(0, Number(p.amount) || 0),
      })),
    features: d.features
      .filter((f) => f.label.trim())
      .map((f) => ({
        label: f.label.trim(),
        included: f.included,
        ...(f.key ? { key: f.key as FeatureKey } : {}),
        ...(f.limit !== undefined && f.limit !== ''
          ? { limit: Number(f.limit) || 0 }
          : {}),
      })),
  };
}

export function PlansManager() {
  const dispatch = useAppDispatch();
  const { data: plans, isLoading } = useListSubscriptionPlansAdminQuery();
  const { data: paymentSettings } = useGetPaymentSettingsQuery();
  const [createPlan, { isLoading: creating }] = useCreateSubscriptionPlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdateSubscriptionPlanMutation();
  const [deletePlan] = useDeleteSubscriptionPlanMutation();

  const billingCurrencies = paymentSettings?.billingCurrencies?.length
    ? paymentSettings.billingCurrencies
    : DEFAULT_BILLING_CURRENCIES;

  const [draft, setDraft] = useState<Draft | null>(null);

  const startNew = () => setDraft({ ...EMPTY_DRAFT });
  const startEdit = (p: SubscriptionPlan) => setDraft(planToDraft(p));

  const onSave = async () => {
    if (!draft) return;
    if (!draft.name || draft.name.length < 2) {
      dispatch(toastPushed('error', 'Plan name is required.'));
      return;
    }
    if (!draft.slug || !/^[a-z0-9-]+$/.test(draft.slug)) {
      dispatch(toastPushed('error', 'Slug must be lowercase letters/digits/dashes.'));
      return;
    }
    const dto = draftToDto(draft);
    try {
      if (draft.id) {
        await updatePlan({ id: draft.id, body: dto }).unwrap();
        dispatch(toastPushed('success', `Plan "${dto.name}" updated.`));
      } else {
        await createPlan(dto).unwrap();
        dispatch(toastPushed('success', `Plan "${dto.name}" created.`));
      }
      setDraft(null);
    } catch {
      /* surfaced by global toast */
    }
  };

  const onDelete = async (p: SubscriptionPlan) => {
    if (!confirm(`Delete plan "${p.name}"? This can't be undone.`)) return;
    try {
      await deletePlan(p.id).unwrap();
      dispatch(toastPushed('success', `Deleted "${p.name}".`));
    } catch {
      /* surfaced by global toast */
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Admin · Plans</span>
        <h1 className={styles.title}>Subscription plans</h1>
        <p className={styles.sub}>
          Define the catalog sellers see at <code>/pricing</code>. Each plan has localised
          prices (one per currency), a feature list rendered on the card, and limits the
          app enforces server-side.
        </p>
      </header>

      <div className={styles.actions}>
        <Button type="button" onClick={startNew}>
          + New plan
        </Button>
      </div>

      {isLoading ? (
        <p className={styles.muted}>Loading plans…</p>
      ) : !plans || plans.length === 0 ? (
        <p className={styles.muted}>
          No plans yet — click &ldquo;New plan&rdquo; to add Free / Gold / Premium or
          whatever fits.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Interval</th>
                <th>Prices</th>
                <th>Features</th>
                <th>State</th>
                <th aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.highlight ? (
                      <span className={styles.popularPill}>Most popular</span>
                    ) : null}
                  </td>
                  <td>
                    <code>{p.slug}</code>
                  </td>
                  <td>{p.interval}</td>
                  <td>
                    {p.prices.length === 0
                      ? '—'
                      : p.prices.map((pr) => `${pr.amount} ${pr.currency}`).join(' · ')}
                  </td>
                  <td>{p.features.length}</td>
                  <td>
                    <span
                      className={cn(
                        styles.statusPill,
                        p.active ? styles.statusOn : styles.statusOff,
                      )}
                    >
                      {p.active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => startEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.linkDanger}
                      onClick={() => onDelete(p)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft ? (
        <DraftEditor
          draft={draft}
          setDraft={setDraft}
          onSave={onSave}
          onCancel={() => setDraft(null)}
          saving={creating || updating}
          billingCurrencies={billingCurrencies}
        />
      ) : null}
    </section>
  );
}

/* ─── editor ───────────────────────────────────────────────────────── */

function DraftEditor({
  draft,
  setDraft,
  onSave,
  onCancel,
  saving,
  billingCurrencies,
}: {
  draft: Draft;
  setDraft: (d: Draft | null) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  billingCurrencies: readonly string[];
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft({ ...draft, [k]: v });

  const addPrice = () => {
    /* Default to the first billing currency not already in use, or
     * USD if every code is exhausted. */
    const used = new Set(draft.prices.map((p) => p.currency.toUpperCase()));
    const next = billingCurrencies.find((c) => !used.has(c.toUpperCase())) ?? 'USD';
    set('prices', [...draft.prices, { currency: next, amount: '0' }]);
  };
  const updatePrice = (i: number, patch: Partial<DraftPrice>) =>
    set(
      'prices',
      draft.prices.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    );
  const removePrice = (i: number) =>
    set(
      'prices',
      draft.prices.filter((_, idx) => idx !== i),
    );

  const addFeature = () =>
    set('features', [
      ...draft.features,
      { label: '', included: true, key: '', limit: '' },
    ]);
  const updateFeature = (i: number, patch: Partial<DraftFeature>) =>
    set(
      'features',
      draft.features.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    );
  const removeFeature = (i: number) =>
    set(
      'features',
      draft.features.filter((_, idx) => idx !== i),
    );

  return (
    <section className={styles.editor}>
      <header className={styles.editorHead}>
        <h2>{draft.id ? 'Edit plan' : 'New plan'}</h2>
        <p className={styles.muted}>
          Slug is the stable identifier — pick something durable like <code>free</code>,{' '}
          <code>gold</code>, <code>premium</code>.
        </p>
      </header>

      <div className={styles.grid}>
        <TextField
          label="Name"
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Gold"
        />
        <TextField
          label="Slug"
          value={draft.slug}
          onChange={(e) => set('slug', e.target.value)}
          placeholder="gold"
          hint="lowercase letters, digits, dashes"
        />
        <TextField
          label="Tagline"
          value={draft.tagline}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="For growing agencies"
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Interval</span>
          <select
            className={styles.select}
            value={draft.interval}
            onChange={(e) => set('interval', e.target.value as PlanInterval)}
          >
            {PLAN_INTERVALS.map((i) => (
              <option key={i} value={i}>
                {i === 'one-time' ? 'One-time' : `Per ${i}`}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Sort order"
          type="number"
          value={String(draft.sortOrder)}
          onChange={(e) => set('sortOrder', Number(e.target.value) || 0)}
          hint="Lower = appears first"
        />
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={draft.highlight}
            onChange={(e) => set('highlight', e.currentTarget.checked)}
          />
          <span>Highlight as &ldquo;Most popular&rdquo;</span>
        </label>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => set('active', e.currentTarget.checked)}
          />
          <span>Active (visible on /pricing)</span>
        </label>
      </div>

      {/* prices */}
      <div className={styles.subsection}>
        <header className={styles.subHead}>
          <h3>Prices</h3>
          <Button type="button" size="sm" onClick={addPrice}>
            + Add price
          </Button>
        </header>
        <p className={styles.muted}>
          Prices must be in one of the platform&apos;s real billing currencies. The
          pricing page converts these into the user&apos;s local currency for display; the
          actual charge always uses one of the values you set here. Add a USD price to
          every paid plan so Stripe/PayPal users always have a fallback.
        </p>
        {draft.prices.length === 0 ? (
          <p className={styles.muted}>
            No prices set — plan will render as &ldquo;Free&rdquo;.
          </p>
        ) : (
          <div className={styles.priceList}>
            {draft.prices.map((p, i) => (
              <div key={i} className={styles.priceRow}>
                <select
                  className={styles.select}
                  value={p.currency}
                  onChange={(e) =>
                    updatePrice(i, {
                      currency: e.target.value.toUpperCase(),
                    })
                  }
                >
                  {/* Keep any legacy non-billing currency selectable
                   *  so the editor doesn't silently drop the row. The
                   *  schema will reject it on save with a clear
                   *  error. */}
                  {!billingCurrencies.includes(p.currency.toUpperCase()) && p.currency ? (
                    <option value={p.currency}>{p.currency} (invalid)</option>
                  ) : null}
                  {billingCurrencies.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={p.amount}
                  onChange={(e) => updatePrice(i, { amount: e.target.value })}
                />
                <button
                  type="button"
                  className={styles.linkDanger}
                  onClick={() => removePrice(i)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* features */}
      <div className={styles.subsection}>
        <header className={styles.subHead}>
          <h3>Features</h3>
          <Button type="button" size="sm" onClick={addFeature}>
            + Add feature
          </Button>
        </header>
        {draft.features.length === 0 ? (
          <p className={styles.muted}>
            No features yet — the card will be empty. Add &ldquo;Agency Profile&rdquo;,
            &ldquo;10 Agents&rdquo;, etc.
          </p>
        ) : (
          <div className={styles.featureList}>
            {draft.features.map((f, i) => (
              <div key={i} className={styles.featureRow}>
                <input
                  className={styles.input}
                  placeholder="Feature label (e.g. 10 Agents)"
                  value={f.label}
                  onChange={(e) => updateFeature(i, { label: e.target.value })}
                />
                <select
                  className={styles.select}
                  value={f.key ?? ''}
                  onChange={(e) =>
                    updateFeature(i, {
                      key: e.target.value as FeatureKey | '',
                    })
                  }
                >
                  <option value="">(no key)</option>
                  {FEATURE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  placeholder="Limit"
                  value={f.limit ?? ''}
                  onChange={(e) => updateFeature(i, { limit: e.target.value })}
                />
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={f.included}
                    onChange={(e) =>
                      updateFeature(i, { included: e.currentTarget.checked })
                    }
                  />
                  <span>Included</span>
                </label>
                <button
                  type="button"
                  className={styles.linkDanger}
                  onClick={() => removeFeature(i)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.formActions}>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Create plan'}
        </Button>
        <button type="button" className={styles.ghost} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}
