'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { FETCH_TAGS } from '@/lib/serverApi';

/**
 * Server action — invalidate every server-rendered consumer of the
 * site-settings endpoint (Footer, contact page header, etc.) so they
 * pull fresh data on the next render.
 *
 * Belt-and-suspenders: we ALSO revalidate the root layout path so
 * `app/layout.tsx` (which mounts the Footer) refetches even if the
 * tag wiring is bypassed somewhere. Calling both is cheap and makes
 * the admin's "save → see change in footer" loop reliable.
 *
 * Called from the admin `SettingsManager` immediately after a
 * successful PATCH. Pair with `router.refresh()` on the client to
 * force the current page to re-render its server components in the
 * same tab.
 */
export async function revalidateSiteSettings(): Promise<void> {
  revalidateTag(FETCH_TAGS.siteSettings);
  /* The 'layout' scope re-runs the root layout (and the Footer it
   * renders) for every nested route on the next navigation/refresh. */
  revalidatePath('/', 'layout');
}
