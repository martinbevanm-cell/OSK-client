import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { THEMES, type SiteSettings, type ThemeName } from '@contracts';
import { StoreProvider } from '@/store/StoreProvider';
import { ThemeProvider, ThemeScript } from '@/components/theme';
import { AuthBootstrap, ImpersonationBanner } from '@/features/auth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Newsletter } from '@/components/layout/Newsletter';
import { Toaster } from '@/components/ui';
import { organizationJsonLd } from '@/lib/seo';
import { serverFetch } from '@/lib/serverApi';
import './globals.scss';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const envTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME as ThemeName | undefined;
const DEFAULT_THEME: ThemeName =
  envTheme && THEMES.includes(envTheme) ? envTheme : 'theme-luxe-light';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const DEFAULT_SITE_TITLE =
  'OSK Property Real Estate | Buy, Sell & Rent Homes & Properties.';

function withEllipsis(input: string, max = 42): string {
  const text = input.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await serverFetch<SiteSettings>('/settings', 0);
  const siteTitle = withEllipsis(settings?.siteTitle?.trim() || DEFAULT_SITE_TITLE);
  const companyName = settings?.companyName?.trim() || 'OSK';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: `%s · ${companyName}`,
    },
    description: 'Discover homes, plots, commercial space and rentals with OSK.',
    openGraph: {
      type: 'website',
      siteName: companyName,
      url: SITE_URL,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* Resolve the active theme server-side so first paint has no flash. The
   * settings endpoint is public; if the backend is unreachable we fall
   * back to the env default. */
  const settings = await serverFetch<SiteSettings>('/settings', 60);
  const activeTheme: ThemeName =
    settings?.activeTheme && THEMES.includes(settings.activeTheme)
      ? settings.activeTheme
      : DEFAULT_THEME;

  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${activeTheme}`}
      data-theme={activeTheme}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript defaultTheme={activeTheme} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <StoreProvider>
          <ThemeProvider serverTheme={activeTheme}>
            <AuthBootstrap />
            <ImpersonationBanner />
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <Header />
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <Newsletter />
            <Footer />
            <Toaster />
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
