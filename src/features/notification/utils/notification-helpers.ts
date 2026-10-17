import { Notification } from '@/types/social';
import { differenceInDays, differenceInWeeks, formatDistanceToNowStrict } from 'date-fns';

/**
 * Format timestamp into short relative string (e.g. "2 days ago", "Just now")
 */
export const formatNotificationTime = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const days = differenceInDays(now, date);

    if (days >= 1 && days <= 7) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    if (days > 7) {
      const weeks = differenceInWeeks(now, date);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }

    const distance = formatDistanceToNowStrict(date);
    return distance
      .replace(/ seconds?/, 's')
      .replace(/ minutes?/, 'm')
      .replace(/ hours?/, 'h') + ' ago';
  } catch {
    return 'Just now';
  }
};

export type NotificationVisualKind = 'security' | 'job' | 'company' | 'avatar';

interface ExtendedNotificationFields {
  isCompanyActor?: boolean;
  referenceId?: string;
  metadata?: {
    post_id?: string;
    comment_id?: string;
    org_slug?: string;
    [key: string]: unknown;
  } | string;
}

/**
 * Determines the visual icon/avatar kind for the notification
 */
export const getNotificationVisualKind = (notification: Notification): NotificationVisualKind => {
  const type = notification.type || '';
  const ext = notification as unknown as ExtendedNotificationFields;

  // Security events show Lock icon
  if (
    type === 'new_device_login' ||
    type === 'password_changed' ||
    type === 'email_changed' ||
    notification.text?.toLowerCase().includes('login') ||
    notification.text?.toLowerCase().includes('password')
  ) {
    return 'security';
  }

  // Job applications and offers
  if (
    type === 'application_submitted' ||
    type === 'application_under_review' ||
    type === 'application_shortlisted' ||
    type === 'job_offer' ||
    type === 'offer_expiring' ||
    type === 'organization_job' ||
    type.includes('job')
  ) {
    return 'job';
  }

  // Company documents / verification
  if (
    type === 'doc_verification_success' ||
    type === 'doc_verification_rejected' ||
    notification.is_company_actor ||
    ext.isCompanyActor ||
    type.startsWith('company_')
  ) {
    return 'company';
  }

  return 'avatar';
};

export interface ParsedNotificationText {
  actorName: string | null;
  actorSuffix: string | null; // e.g. "(Unavailable user)" or "(Unavailable page)"
  boldTarget: string | null;   // e.g. "Hrutika" in "at Hrutika"
  prefixText: string;
  bodyText: string;
}

/**
 * Parses notification text into structured parts for styling:
 * Bold actor / Bold target entity / Body text / Suffix badges
 */
export const parseNotificationText = (
  notification: Notification,
  activeProfileName?: string
): ParsedNotificationText => {
  const type = notification.type || '';
  const actorName = notification.actor_name || null;
  let actorSuffix: string | null = null;
  let boldTarget: string | null = null;
  let prefixText = '';
  let bodyText = notification.text || '';

  // Check unavailable state
  if (actorName) {
    if (bodyText.includes('(Unavailable user)')) {
      actorSuffix = '(Unavailable user)';
      bodyText = bodyText.replace('(Unavailable user)', '').trim();
    } else if (bodyText.includes('(Unavailable page)')) {
      actorSuffix = '(Unavailable page)';
      bodyText = bodyText.replace('(Unavailable page)', '').trim();
    }
  }

  // Job application submission: e.g. "Your application for Tech HR at Hrutika has been submitted successfully."
  if (type === 'application_submitted') {
    const match = bodyText.match(/^(.*?)\s+at\s+([A-Za-z0-9_\s]+?)\s+(has been submitted.*)$/i);
    if (match) {
      prefixText = `${match[1]} at `;
      boldTarget = match[2].trim();
      bodyText = ` ${match[3]}`;
      return { actorName: null, actorSuffix, boldTarget, prefixText, bodyText };
    }
  }

  // Document verification success
  if (type === 'doc_verification_success') {
    if (bodyText.startsWith('Congratulations')) {
      return { actorName: null, actorSuffix, boldTarget: null, prefixText: '', bodyText };
    }
    const name = actorName || activeProfileName || 'user';
    return {
      actorName: null,
      actorSuffix,
      boldTarget: null,
      prefixText: '',
      bodyText: `Congratulations ${name}, we have successfully reviewed and verified your documents. Your profile is now verified.`,
    };
  }

  // Strip duplicated actor name from start of bodyText if present
  if (actorName && bodyText) {
    const escapedActor = actorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    bodyText = bodyText.replace(new RegExp(`^"?${escapedActor}"?\\s*`, 'i'), '').trim();
  }

  return {
    actorName,
    actorSuffix,
    boldTarget,
    prefixText,
    bodyText,
  };
};

/**
 * Resolves the navigation route when a notification is clicked
 */
export const getNotificationRoute = (
  notification: Notification,
  activeProfile?: { name?: string; slug?: string } | null,
  isCompany?: boolean
): string | null => {
  const type = notification.type || '';
  const ext = notification as unknown as ExtendedNotificationFields;

  const postReferenceId =
    notification.reference_id ||
    ext.referenceId ||
    (typeof ext.metadata === 'object' && ext.metadata !== null ? ext.metadata.post_id : null) ||
    null;

  if (type === 'like' && postReferenceId) {
    return `/post/${postReferenceId}`;
  }
  if (type === 'follow' && notification.reference_id) {
    return `/profile/${notification.reference_id}`;
  }
  if (type === 'repost' && postReferenceId) {
    return `/post/${postReferenceId}`;
  }
  if (type === 'connection_request' && notification.reference_id) {
    return '/connections?tab=received';
  }
  if ((type === 'connection_accepted' || type === 'new_connection') && notification.reference_id) {
    return notification.is_company_actor
      ? `/organization/${notification.actor_slug || notification.reference_id}`
      : `/profile/${notification.reference_id}`;
  }
  if (type === 'company_connection_accepted' && notification.reference_id) {
    return `/organization/${notification.reference_id}`;
  }
  if (
    (type === 'comment' || type === 'mention' || type === 'reply' || type === 'post_tag') &&
    postReferenceId
  ) {
    let commentId: string | undefined;
    try {
      if (typeof ext.metadata === 'string') {
        const parsed = JSON.parse(ext.metadata);
        commentId = parsed.comment_id;
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        commentId = ext.metadata.comment_id;
      }
    } catch {
      // Ignore json parse error
    }
    return type !== 'post_tag' && commentId
      ? `/post/${postReferenceId}?commentId=${commentId}`
      : `/post/${postReferenceId}`;
  }
  if (type === 'channel_article' && postReferenceId) {
    return `/post/${postReferenceId}`;
  }
  if (type === 'message_reaction' && notification.reference_id) {
    return `/messaging?conversationId=${notification.reference_id}`;
  }
  if (type === 'company_channel_subscriber' && notification.reference_id) {
    return `/profile/${notification.reference_id}`;
  }
  if (type === 'company_channel_milestone' && notification.reference_id) {
    const slug = (typeof ext.metadata === 'object' && ext.metadata !== null ? ext.metadata.org_slug : undefined) || notification.reference_id;
    return `/organization/${slug}`;
  }
  if (type === 'advocacy' && postReferenceId) {
    return `/post/${postReferenceId}`;
  }
  if (
    (type.includes('job') || type.includes('application') || type.includes('offer')) &&
    notification.reference_id
  ) {
    return `/jobs/${notification.reference_id}`;
  }
  if (type === 'community_invite') {
    return '/connections?tab=invitations&sub=channels';
  }
  if (type === 'organization_invite' || type === 'ORGANIZATION_INVITE') {
    return '/connections?tab=invitations&sub=teams';
  }
  if (
    type === 'new_device_login' ||
    type === 'password_changed' ||
    type === 'email_changed'
  ) {
    return '/settings/security';
  }
  if (
    type === 'profile_incomplete_nudge' ||
    notification.text?.toLowerCase().includes('complete your profile')
  ) {
    return isCompany && activeProfile?.slug
      ? `/organization/${activeProfile.slug}`
      : '/profile';
  }

  return null;
};
