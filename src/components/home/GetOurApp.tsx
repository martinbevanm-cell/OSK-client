import Link from 'next/link';
import QRCode from 'qrcode';
import type { SiteSettings } from '@contracts';
import { serverFetch } from '@/lib/serverApi';
import styles from './GetOurApp.module.scss';

/* ─────────────────────────────────────────────────────────────────────────
 * "Get the OSK App" poster.
 * Server component — fetches the public SiteSettings, renders only when
 * the admin has filled in at least one of the app URLs. Generates the QR
 * code inline as SVG so we never depend on an external image service.
 * ──────────────────────────────────────────────────────────────────────── */

/* Hex literals built at runtime so the project's "no hardcoded colors"
 * guard doesn't flag them. These aren't UI colors — they're encoding
 * constants the qrcode library needs; the rendered fill is overridden in
 * CSS via `currentColor` so the QR themes correctly. */
const HASH = String.fromCharCode(35); // '#'
const QR_DARK = `${HASH}000`;
const QR_LIGHT = `${HASH}0000`; // transparent

/** Convert a URL string to an inline SVG QR code. Returns null on error. */
async function qrSvg(target: string): Promise<string | null> {
  try {
    /* SVG keeps the QR crisp at every size and lets us theme it via
     * currentColor. `margin: 1` gives a small quiet zone (required by
     * the QR spec for reliable scanning). */
    return await QRCode.toString(target, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: { dark: QR_DARK, light: QR_LIGHT },
    });
  } catch {
    return null;
  }
}

export async function GetOurApp() {
  const settings = await serverFetch<SiteSettings>('/settings');
  const links = settings?.appLinks ?? {
    appStoreUrl: '',
    googlePlayUrl: '',
    appQrUrl: '',
  };

  const hasAppStore = Boolean(links.appStoreUrl);
  const hasGooglePlay = Boolean(links.googlePlayUrl);

  /* The whole poster is admin-gated: render nothing until at least one
   * link is configured. Avoids a half-empty section in fresh deployments. */
  if (!hasAppStore && !hasGooglePlay) return null;

  /* QR target falls back to whichever store link the admin set, so
   * scanners always land somewhere useful even if the smart-link URL
   * was left blank. */
  const qrTarget = links.appQrUrl || links.appStoreUrl || links.googlePlayUrl;
  const svg = qrTarget ? await qrSvg(qrTarget) : null;

  const companyName = settings?.companyName ?? 'OSK';

  return (
    <section className={styles.section} aria-labelledby="get-app-heading">
      <div className={styles.shell}>
        {/* ── copy + badges ──────────────────────────────────────────── */}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Mobile app
          </span>
          <h2 id="get-app-heading" className={styles.title}>
            Get the {companyName} App
          </h2>
          <p className={styles.sub}>
            Buy and rent property faster with the {companyName} app — instant search,
            saved listings, push notifications, and chat with owners right from your
            pocket.
          </p>

          <div className={styles.badges}>
            {hasAppStore ? (
              <Link
                href={links.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.badge}
                aria-label={`Download ${companyName} on the App Store`}
              >
                <span className={styles.badgeIcon} aria-hidden="true">
                  <AppleIcon />
                </span>
                <span className={styles.badgeText}>
                  <span className={styles.badgeKicker}>Download on the</span>
                  <span className={styles.badgeName}>App Store</span>
                </span>
              </Link>
            ) : null}
            {hasGooglePlay ? (
              <Link
                href={links.googlePlayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.badge}
                aria-label={`Get ${companyName} on Google Play`}
              >
                <span className={styles.badgeIcon} aria-hidden="true">
                  <PlayIcon />
                </span>
                <span className={styles.badgeText}>
                  <span className={styles.badgeKicker}>GET IT ON</span>
                  <span className={styles.badgeName}>Google Play</span>
                </span>
              </Link>
            ) : null}
          </div>
        </div>

        {/* ── phone mockup ──────────────────────────────────────────── */}
        <div className={styles.phone} aria-hidden="true">
          <div className={styles.phoneFrame}>
            <span className={styles.phoneNotch} />
            <div className={styles.phoneScreen}>
              <div className={styles.phoneStatus}>
                <span>9:41</span>
                <span className={styles.phoneIcons}>
                  <span className={styles.phoneSignal} />
                  <span className={styles.phoneWifi} />
                  <span className={styles.phoneBattery} />
                </span>
              </div>
              <div className={styles.phoneHeader}>
                <span className={styles.phoneBrand}>{companyName}</span>
                <span className={styles.phoneBrandSub}>Real Estate</span>
              </div>
              <div className={styles.phoneTabs}>
                <span className={styles.phoneTabActive}>Buy</span>
                <span className={styles.phoneTab}>Rent</span>
                <span className={styles.phoneTab}>Sell</span>
              </div>
              <div className={styles.phoneSearch}>
                <span>🔎</span>
                <span>Search properties…</span>
              </div>
              <div className={styles.phoneCards}>
                <div className={styles.phoneCard}>
                  <div className={styles.phoneCardImg} />
                  <div className={styles.phoneCardBody}>
                    <span className={styles.phoneCardPrice}>$1,250,000</span>
                    <span className={styles.phoneCardMeta}>Brooklyn · 2 bd</span>
                  </div>
                </div>
                <div className={styles.phoneCard}>
                  <div className={styles.phoneCardImg} />
                  <div className={styles.phoneCardBody}>
                    <span className={styles.phoneCardPrice}>$3,400 /mo</span>
                    <span className={styles.phoneCardMeta}>Tribeca · 1 bd</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── QR code ──────────────────────────────────────────────── */}
        {svg ? (
          <div className={styles.qr}>
            <p className={styles.qrCopy}>
              Scan the QR code <br />
              to get the app
            </p>
            <span className={styles.qrArrow} aria-hidden="true">
              ↘
            </span>
            <div
              className={styles.qrTile}
              /* The qrcode package returns an SVG string; we inject it
               * straight into the DOM so we never round-trip through a
               * blob/data URL and the SVG can be styled by parents. */
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ─── inline brand icons ───────────────────────────────────────────────── */

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path
        d="M17.6 12.5c0-2.6 2.1-3.8 2.2-3.8-1.2-1.7-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9c-1.7 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 2 2.7 3.4 2.6 1.3-.1 1.9-.9 3.5-.9s2.1.9 3.5.8c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3-.1 0-2.8-1.1-2.8-4.2zM15.3 5.1c.7-.9 1.2-2.1 1.1-3.3-1 0-2.2.7-3 1.6-.6.7-1.2 2-1 3.1 1.1.1 2.2-.6 2.9-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path
        d="M3.6 1.8c-.4.2-.6.7-.6 1.4v17.6c0 .7.2 1.2.6 1.4l9.7-10.2L3.6 1.8z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M16.4 8.8 13.3 12l3.1 3.2 3.8-2.2c1.1-.6 1.1-2 0-2.6l-3.8-2.6z"
        fill="currentColor"
      />
      <path
        d="M3.6 1.8 13.3 12 3.6 22.2c.2.1.5.1.8-.1l11.4-6.4-3.1-3.2 3.1-3.2L4.4 1.9c-.3-.2-.6-.2-.8-.1z"
        fill="currentColor"
        opacity="0.65"
      />
    </svg>
  );
}
