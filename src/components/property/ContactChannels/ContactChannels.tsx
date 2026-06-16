'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ContactCapabilities } from '@contracts';
import {
  useLazyGetWhatsAppLinkQuery,
  useLogCallIntentMutation,
} from '@/features/contact';
import { useStartThreadMutation } from '@/features/messages';
import { selectCurrentUser, selectIsAuthenticated } from '@/features/auth';
import { toastPushed } from '@/features/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/cn';
import { ChatIcon, MailIcon, PhoneIcon, WhatsAppIcon } from './icons';
import { InquiryForm } from './InquiryForm';
import { CallbackForm } from './CallbackForm';
import styles from './ContactChannels.module.scss';

interface ContactChannelsProps {
  propertyId: string;
  /** Owner-controlled, per-property capabilities (never raw email/phone). */
  capabilities: ContactCapabilities;
  variant?: 'card' | 'detail';
  /** Analytics context for the call-intent event. */
  source: 'listing-card' | 'detail-page';
  /** Opens the realtime chat thread; falls back to a sign-in prompt. */
  onStartChat?: () => void;
  /** Owner of the listing. When the signed-in viewer matches, the whole
   * channel cluster is hidden — you don't email/chat/call yourself. */
  ownerId?: string;
}

type Panel = 'inquiry' | 'callback' | null;

/**
 * The four client→owner contact channels: in-app chat, call (with callback
 * request), WhatsApp deep link, and email relay. Only owner-enabled channels
 * render; if none are enabled a graceful fallback is shown instead.
 */
export function ContactChannels({
  propertyId,
  capabilities,
  variant = 'detail',
  source,
  onStartChat,
  ownerId,
}: ContactChannelsProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthed = useAppSelector(selectIsAuthenticated);
  const viewer = useAppSelector(selectCurrentUser);
  const [panel, setPanel] = useState<Panel>(null);
  const [logCallIntent] = useLogCallIntentMutation();
  const [fetchWhatsApp, { isFetching: waLoading }] = useLazyGetWhatsAppLinkQuery();
  const [startThread, { isLoading: chatStarting }] = useStartThreadMutation();

  const compact = variant === 'card';
  const anyEnabled =
    capabilities.chat ||
    capabilities.call.enabled ||
    capabilities.whatsapp ||
    capabilities.email;

  /* Viewer owns this listing — hide every contact action and show a
   * friendly hint pointing them to the dashboard. Prevents the 403 the
   * backend would return when start-thread checks owner === actor. */
  const viewerIsOwner = Boolean(ownerId && viewer && viewer.id === ownerId);

  if (viewerIsOwner) {
    return (
      <p className={styles.fallback}>
        This is your listing — contact options aren&rsquo;t shown to owners. Buyer
        messages and inquiries land in your{' '}
        <Link href="/dashboard/messages" className={styles.fallbackLink}>
          dashboard
        </Link>
        .
      </p>
    );
  }

  if (!anyEnabled) {
    return (
      <p className={styles.fallback}>
        The owner hasn’t enabled contact options for this listing yet.
      </p>
    );
  }

  const handleChat = async () => {
    if (onStartChat) {
      onStartChat();
      return;
    }
    if (!isAuthed) {
      dispatch(toastPushed('info', 'Sign in to start a live chat with the owner.'));
      router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const thread = await startThread({ propertyId }).unwrap();
      router.push(`/dashboard/messages?thread=${thread.id}`);
    } catch {
      /* surfaced by the global toast middleware */
    }
  };

  const handleCall = async () => {
    // Privacy-preserving: log intent, then open the callback flow rather than
    // exposing the owner's number directly.
    try {
      await logCallIntent({ propertyId, source }).unwrap();
    } catch {
      /* analytics failure is non-blocking */
    }
    setPanel((p) => (p === 'callback' ? null : 'callback'));
  };

  const handleWhatsApp = async () => {
    try {
      const res = await fetchWhatsApp(propertyId).unwrap();
      if (res.enabled && res.href) {
        window.open(res.href, '_blank', 'noopener,noreferrer');
      } else {
        dispatch(toastPushed('info', 'WhatsApp is not available for this listing.'));
      }
    } catch {
      /* failure toast raised globally */
    }
  };

  const handleEmail = () => setPanel((p) => (p === 'inquiry' ? null : 'inquiry'));

  return (
    <div className={cn(styles.root, compact && styles.card)}>
      <div className={styles.channels}>
        {capabilities.chat && (
          <button
            type="button"
            className={cn(styles.channel, compact && styles.cardChannel)}
            onClick={handleChat}
            disabled={chatStarting}
            aria-label="Chat with the owner"
          >
            <ChatIcon className={styles.icon} />
            {!compact && <span>{chatStarting ? 'Opening…' : 'Chat'}</span>}
          </button>
        )}

        {capabilities.call.enabled && (
          <button
            type="button"
            className={cn(styles.channel, compact && styles.cardChannel)}
            onClick={handleCall}
            aria-label="Call the owner"
          >
            <PhoneIcon className={styles.icon} />
            {!compact && (
              <span>{capabilities.call.masked ? 'Request call' : 'Call'}</span>
            )}
          </button>
        )}

        {capabilities.whatsapp && (
          <button
            type="button"
            className={cn(styles.channel, compact && styles.cardChannel)}
            onClick={handleWhatsApp}
            disabled={waLoading}
            aria-label="Message the owner on WhatsApp"
          >
            <WhatsAppIcon className={styles.icon} />
            {!compact && <span>WhatsApp</span>}
          </button>
        )}

        {capabilities.email && (
          <button
            type="button"
            className={cn(styles.channel, compact && styles.cardChannel)}
            onClick={handleEmail}
            aria-label="Email the owner"
          >
            <MailIcon className={styles.icon} />
            {!compact && <span>Email</span>}
          </button>
        )}
      </div>

      {panel === 'inquiry' && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Email the owner</p>
          <InquiryForm propertyId={propertyId} onDone={() => setPanel(null)} />
        </div>
      )}

      {panel === 'callback' && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Request a callback</p>
          <CallbackForm propertyId={propertyId} onDone={() => setPanel(null)} />
        </div>
      )}
    </div>
  );
}
