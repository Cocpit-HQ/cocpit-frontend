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
  const type: string = (notification.type as string) || '';
  const ext = notification as unknown as ExtendedNotificationFields;

  // Security events show Lock icon
  if (
    type === 'new_device_login' ||
    type === 'password_changed' ||
    type === 'email_changed' ||
    type === 'password_reset_requested' ||
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
    type === 'org_doc_verification_success' ||
    type === 'org_doc_verification_rejected' ||
    type === 'org_doc_verification_submitted' ||
    type === 'member_role_updated' ||
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
  boldTarget: string | null;   // e.g. "Hrutika" in "at Hrutika" or role name "test2"
  boldTargetClassName?: string;
  prefixText: string;
  middleText?: string;
  bodyText: string;
  targetUrl?: string | null;
}

/**
 * Parses notification text into structured parts for styling:
 * Bold actor / Bold target entity / Body text / Suffix badges
 */
export const parseNotificationText = (
  notification: Notification,
  activeProfileName?: string
): ParsedNotificationText => {
  const type: string = (notification.type as string) || '';
  let actorName = notification.actor_name || null;
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

  // Company follower notification: e.g. "radha started following dyp university"
  const followerText = notification.text || bodyText || '';

  const isCompanyFollower =
    type === 'company_follower' ||
    /started following/i.test(followerText);

  if (isCompanyFollower) {
    const match = followerText.trim().match(/^(.*?)\s+started following\s+(.+?)(?:\.|\s*)$/i);
    const followerName = (match && match[1] ? match[1].trim() : null) || 'Someone';
    const ext = notification as unknown as ExtendedNotificationFields;
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    const followerId =
      (meta.followerId as string) ||
      (meta.follower_id as string) ||
      notification.sender_id;

    const targetUrl = followerId ? `/profile/${followerId}` : null;
    const orgName = match && match[2] ? match[2].trim().replace(/\.$/, '') : '';

    return {
      actorName: actorName || orgName || null,
      actorSuffix: null,
      boldTarget: followerName,
      boldTargetClassName: 'text-ds-text-primary',
      prefixText: '',
      middleText: undefined,
      bodyText: orgName ? ` started following ${orgName}` : ' started following you',
      targetUrl,
    };
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
    const displayName = (activeProfileName && activeProfileName.trim()) || (actorName && actorName.trim()) || 'user';
    if (bodyText.startsWith('Congratulations')) {
      const match = bodyText.match(/^Congratulations\s+([^,]+),\s*(.*)$/i);
      if (match && displayName && displayName !== 'user') {
        return {
          actorName: null,
          actorSuffix,
          boldTarget: null,
          prefixText: '',
          bodyText: `Congratulations ${displayName}, ${match[2]}`,
        };
      }
      return { actorName: null, actorSuffix, boldTarget: null, prefixText: '', bodyText };
    }
    return {
      actorName: null,
      actorSuffix,
      boldTarget: null,
      prefixText: '',
      bodyText: `Congratulations ${displayName}, we have successfully reviewed and verified your documents. Your profile is now verified.`,
    };
  }

  // Strip duplicated actor name from start of bodyText if present
  if (actorName && bodyText) {
    const escapedActor = actorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    bodyText = bodyText.replace(new RegExp(`^"?${escapedActor}"?\\s*`, 'i'), '').trim();
  } else if (!actorName) {
    const actorMatch = bodyText.match(/^([A-Za-z0-9_\s]+?)\s+(?:accepted your invitation|joined the)/i);
    if (actorMatch) {
      actorName = actorMatch[1].trim();
      bodyText = bodyText.slice(actorName.length).trim();
    }
  }

  // Member role updated: e.g. "Your role at [Company Name] has been updated to [New Role]."
  const rawNotifText = notification.text || bodyText || '';

  const isRoleUpdated =
    type === 'member_role_updated' ||
    /has been updated to/i.test(rawNotifText) ||
    /Your role at/i.test(rawNotifText);

  if (isRoleUpdated) {
    let textToParse = rawNotifText.trim();
    // Strip any preceding actor/company name (e.g. "mourya Tech Your role at...")
    textToParse = textToParse.replace(/^.*?Your role at\s+/i, 'Your role at ');
    const roleMatch = textToParse.match(/^Your role at\s+(.+?)\s+has been updated to\s+(.+?)(?:\.|\s*)$/i);
    if (roleMatch) {
      const companyName = roleMatch[1].trim();
      const roleName = roleMatch[2].trim().replace(/\.$/, '');
      const ext = notification as unknown as ExtendedNotificationFields;
      let meta: Record<string, any> = {};
      try {
        if (typeof ext.metadata === 'string') {
          meta = JSON.parse(ext.metadata);
        } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
          meta = ext.metadata as Record<string, any>;
        }
      } catch {}

      const orgId =
        (meta.orgId as string) ||
        (meta.org_id as string) ||
        (notification as any).recipient_company_id ||
        (notification as any).recipient_org_id ||
        notification.reference_id;
      const roleTarget = (meta.roleId as string) || (meta.role_id as string) || encodeURIComponent(roleName);
      // SCRUM-1610: Append from=/notifications so RoleDetailsPage returns to Notification center on Back
      const orgQuery = orgId ? `?from=/notifications&orgId=${orgId}` : '?from=/notifications';
      const targetUrl = `/team/role/${roleTarget}${orgQuery}`;

      return {
        actorName: null, // strictly null so actor name is not prepended
        actorSuffix: null,
        boldTarget: roleName,
        prefixText: `Your role at ${companyName} has been updated to `,
        middleText: undefined,
        bodyText: '',
        targetUrl,
      };
    }

    return {
      actorName: null,
      actorSuffix: null,
      boldTarget: null,
      prefixText: '',
      bodyText: textToParse,
      targetUrl: null,
    };
  }

  // Ownership transferred: e.g. "You are now the Owner of [Company Name]."
  const isOwnershipTransferred =
    type === 'company_ownership_transferred' ||
    /You are now the Owner of/i.test(rawNotifText);

  if (isOwnershipTransferred) {
    let textToParse = rawNotifText.trim();
    textToParse = textToParse.replace(/^.*?You are now the Owner of\s+/i, 'You are now the Owner of ');
    const ownerMatch = textToParse.match(/^You are now the Owner of\s+(.+?)(?:\.|\s*)$/i);
    if (ownerMatch) {
      const companyName = ownerMatch[1].trim().replace(/\.$/, '');
      const ext = notification as unknown as ExtendedNotificationFields;
      let meta: Record<string, any> = {};
      try {
        if (typeof ext.metadata === 'string') {
          meta = JSON.parse(ext.metadata);
        } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
          meta = ext.metadata as Record<string, any>;
        }
      } catch {}

      const orgId =
        (meta.orgId as string) ||
        (meta.org_id as string) ||
        (notification as any).recipient_company_id ||
        (notification as any).recipient_org_id ||
        notification.reference_id;
      const orgSlug = (meta.orgSlug as string) || (meta.org_slug as string);
      const targetUrl = orgId ? `/team?orgId=${orgId}` : (orgSlug ? `/organization/${orgSlug}` : '/team');

      return {
        actorName: null,
        actorSuffix: null,
        boldTarget: companyName,
        prefixText: 'You are now the Owner of ',
        middleText: undefined,
        bodyText: '',
        targetUrl,
      };
    }

    return {
      actorName: null,
      actorSuffix: null,
      boldTarget: null,
      prefixText: '',
      bodyText: textToParse,
      targetUrl: null,
    };
  }

  // Team invite accepted notification: e.g. "accepted your invitation and joined the test2 team."
  const isTeamInviteAccepted =
    type === 'team_invite_accepted' ||
    /(?:accepted your invitation and joined the|joined the)\s+.+?\s+team/i.test(bodyText);

  if (isTeamInviteAccepted) {
    const teamMatch = bodyText.match(
      /^(.*?(?:accepted your invitation and joined the|joined the)\s+)(.+?)(\s+team(?:[.!].*)?$)/i
    );
    if (teamMatch) {
      const ext = notification as unknown as ExtendedNotificationFields;
      let meta: Record<string, any> = {};
      try {
        if (typeof ext.metadata === 'string') {
          meta = JSON.parse(ext.metadata);
        } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
          meta = ext.metadata as Record<string, any>;
        }
      } catch {}

      const extractedRole = teamMatch[2].trim();
      const boldTargetName = (meta.role as string) || (meta.roleName as string) || extractedRole;
      const orgId =
        (meta.orgId as string) ||
        (meta.org_id as string) ||
        (notification as any).recipient_company_id ||
        (notification as any).recipient_org_id ||
        notification.reference_id;
      const roleTarget = (meta.roleId as string) || (meta.role_id as string) || encodeURIComponent(boldTargetName);
      // SCRUM-1610: Append from=/notifications so RoleDetailsPage returns to Notification center on Back
      const orgQuery = orgId ? `?from=/notifications&orgId=${orgId}` : '?from=/notifications';
      const targetUrl = `/team/role/${roleTarget}${orgQuery}`;

      return {
        actorName,
        actorSuffix,
        boldTarget: boldTargetName,
        prefixText: '',
        middleText: teamMatch[1],
        bodyText: teamMatch[3],
        targetUrl,
      };
    }
  }

  // Team invite declined notification: e.g. "[User Name] declined your invitation to join as [Role]."
  const isTeamInviteDeclined =
    type === 'team_invite_declined' ||
    /declined your invitation to join as/i.test(rawNotifText);

  if (isTeamInviteDeclined) {
    let textToParse = rawNotifText.trim();
    const ext = notification as unknown as ExtendedNotificationFields;
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    const orgName = (meta.orgName as string) || (meta.org_name as string) || '';
    if (orgName && textToParse.toLowerCase().startsWith(orgName.toLowerCase())) {
      textToParse = textToParse.slice(orgName.length).trim();
    }
    if (actorName && textToParse.toLowerCase().startsWith(actorName.toLowerCase())) {
      textToParse = textToParse.slice(actorName.length).trim();
    }

    const declinedMatch = textToParse.match(/^(?:(.*?)\s+)?declined your invitation to join as\s+(.+?)(?:\.|\s*)$/i);
    const userDeclinedName =
      (meta.userName as string) ||
      (meta.user_name as string) ||
      (declinedMatch && declinedMatch[1] ? declinedMatch[1].trim() : null) ||
      (actorName && (!orgName || actorName.toLowerCase() !== orgName.toLowerCase()) ? actorName : null) ||
      'User';
    const roleName =
      (meta.roleName as string) ||
      (meta.role as string) ||
      (declinedMatch && declinedMatch[2] ? declinedMatch[2].trim().replace(/\.$/, '') : 'Team Member');
    const orgId =
      (meta.orgId as string) ||
      (meta.org_id as string) ||
      (notification as any).recipient_company_id ||
      (notification as any).recipient_org_id ||
      notification.reference_id;
    const targetUrl = orgId ? `/team?orgId=${orgId}` : '/team';

    return {
      actorName: userDeclinedName,
      actorSuffix,
      boldTarget: roleName,
      prefixText: '',
      middleText: ' declined your invitation to join as ',
      bodyText: '',
      targetUrl,
    };
  }

  // Team member removed notification: e.g. "[User Name] was removed from [Company Name]"
  // Personal notification for removed user: "You were removed from [Company Name]"
  const isTeamMemberRemoved =
    type === 'team_member_removed' ||
    /(?:was|were) removed from/i.test(rawNotifText);

  if (isTeamMemberRemoved) {
    const textToParse = rawNotifText.trim();
    const removedMatch = textToParse.match(/^(.*?)\s+(?:was|were)\s+removed from\s+([^.]+?)(?:\s+by\s+.+?)?(?:\.|\s*)$/i);
    const ext = notification as unknown as ExtendedNotificationFields;
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    // If the text starts with "You were removed", show "You" as actorName
    const isPersonalRemoval = /^You\s+were\s+removed/i.test(textToParse);
    const targetUser = isPersonalRemoval
      ? 'You'
      : (meta.targetUserName as string) || (removedMatch ? removedMatch[1].trim() : '') || 'Member';
    const compName = (meta.orgName as string) || (meta.org_name as string) || (removedMatch ? removedMatch[2].trim() : '') || 'Organization';

    const orgId =
      (meta.orgId as string) ||
      (meta.org_id as string) ||
      (notification as any).recipient_company_id ||
      (notification as any).recipient_org_id ||
      notification.reference_id;
    const targetUrl = orgId ? `/team?orgId=${orgId}` : '/team';

    return {
      actorName: targetUser,
      actorSuffix: null,
      prefixText: '',
      middleText: isPersonalRemoval ? ' were removed from ' : ' was removed from ',
      boldTarget: compName,
      bodyText: '',
      targetUrl,
    };
  }

  // Job approved: "Your job [Job Title] is now live."
  const isJobApproved =
    type === 'job_approved' ||
    type === 'job_live' ||
    type === 'job_published' ||
    type === 'job_rejected' ||
    /Your job.+?is now live/i.test(rawNotifText);

  if (isJobApproved) {
    const ext = notification as unknown as ExtendedNotificationFields;
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    const jobTitleMatch = rawNotifText.match(/Your job\s+[“"']?(.*?)[”"']?\s+is now live/i);
    let jobTitle = (meta.jobTitle as string) || (jobTitleMatch ? jobTitleMatch[1] : 'Job');
    jobTitle = jobTitle.replace(/^[“"']+|[”"']+$/g, '').trim();
    const jobId = (meta.jobId as string) || (meta.job_id as string) || notification.reference_id;
    const targetUrl = jobId ? `/jobs?tab=My+Listings&jobId=${jobId}` : '/jobs?tab=My+Listings';

    return {
      actorName: null,
      actorSuffix: null,
      boldTarget: jobTitle,
      prefixText: 'Your job ',
      middleText: undefined,
      bodyText: ' is now live.',
      targetUrl,
    };
  }

  // Job rejected: "Your job [Job Title] wasn’t approved. Reason: [Reason]."
  const isJobRejected =
    type === 'job_rejected' ||
    /Your job.+?wasn[’']t approved/i.test(rawNotifText);

  if (isJobRejected) {
    const ext = notification as unknown as ExtendedNotificationFields;
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    const jobTitleMatch = rawNotifText.match(/Your job\s+[“"']?(.*?)[”"']?\s+wasn[’']t approved/i);
    const reasonMatch = rawNotifText.match(/Reason:\s*(.+?)(?:\.|\s*)$/i);
    let jobTitle = (meta.jobTitle as string) || (jobTitleMatch ? jobTitleMatch[1] : 'Job');
    jobTitle = jobTitle.replace(/^[“"']+|[”"']+$/g, '').trim();
    const reason = (meta.rejectionReason as string) || (reasonMatch ? reasonMatch[1].trim().replace(/\.$/, '') : 'Not specified');
    const jobId = (meta.jobId as string) || (meta.job_id as string) || notification.reference_id;
    const targetUrl = jobId ? `/jobs?tab=My+Listings&jobId=${jobId}` : '/jobs?tab=My+Listings';

    return {
      actorName: null,
      actorSuffix: null,
      boldTarget: jobTitle,
      prefixText: 'Your job ',
      middleText: undefined,
      bodyText: ` wasn’t approved. Reason: ${reason}.`,
      targetUrl,
    };
  }

  // Password reset request security alert
  const isPasswordResetRequested =
    type === 'password_reset_requested' ||
    /password reset was requested/i.test(rawNotifText);

  if (isPasswordResetRequested) {
    return {
      actorName: null,
      actorSuffix: null,
      boldTarget: null,
      prefixText: '',
      bodyText: 'A password reset was requested for your account. If this wasn’t you, secure your account now.',
      targetUrl: '/settings/account',
    };
  }

  // Candidate declined/accepted offer notification: e.g. "You declined the offer from dyp university for sap"
  const isCandidateOfferResponse =
    /^You\s+(?:declined|accepted)\s+the offer/i.test(rawNotifText);

  if (isCandidateOfferResponse) {
    const ext = notification as unknown as ExtendedNotificationFields;
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    const match = rawNotifText.match(/^You\s+(declined|accepted)\s+the offer from\s+(.+?)\s+for\s+(.+?)(?:\.|\s*)$/i);
    const actionVerb = match ? match[1] : 'declined';
    const company = match ? match[2].trim() : '';
    const jobTitle = match ? match[3].trim() : 'job';
    const jobId = (meta.job_id as string) || (meta.jobId as string) || notification.reference_id;
    const targetUrl = jobId ? `/jobs/${jobId}?returnTo=/notifications` : '/jobs';

    return {
      actorName: null,
      actorSuffix: null,
      boldTarget: jobTitle,
      prefixText: company ? `You ${actionVerb} the offer from ${company} for ` : `You ${actionVerb} the offer for `,
      middleText: undefined,
      bodyText: '',
      targetUrl,
    };
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
  isCompany?: boolean,
  currentUserId?: string
): string | null => {
  const type: string = (notification.type as string) || '';
  const ext = notification as unknown as ExtendedNotificationFields;

  const postReferenceId =
    notification.reference_id ||
    ext.referenceId ||
    (typeof ext.metadata === 'object' && ext.metadata !== null ? ext.metadata.post_id : null) ||
    null;

  if (type === 'like' && postReferenceId) {
    return `/post/${postReferenceId}`;
  }
  if (type === 'company_follower') {
    const followerId =
      notification.sender_id ||
      (typeof ext.metadata === 'object' && ext.metadata !== null
        ? ((ext.metadata as Record<string, unknown>).followerId as string) ||
          ((ext.metadata as Record<string, unknown>).follower_id as string)
        : null);
    if (followerId) {
      return `/profile/${followerId}`;
    }
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
    type === 'member_role_updated' ||
    (notification.text?.startsWith('Your role at ') && notification.text?.includes('has been updated to'))
  ) {
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    const orgId =
      (meta.orgId as string) ||
      (meta.org_id as string) ||
      (notification as any).recipient_company_id ||
      (notification as any).recipient_org_id ||
      notification.reference_id;
    let roleTarget = (meta.roleId as string) || (meta.role_id as string);
    if (!roleTarget && notification.text) {
      const match = notification.text.match(/has been updated to\s+(.*?)(?:\.|\s*)$/i);
      if (match) {
        roleTarget = encodeURIComponent(match[1].trim());
      }
    }

    const orgQuery = orgId ? `?orgId=${orgId}` : '';
    if (roleTarget) {
      return `/team/role/${roleTarget}${orgId ? `?from=/notifications&orgId=${orgId}` : '?from=/notifications'}`;
    }
    return orgQuery ? `/team${orgQuery}` : '/team';
  }

  if (
    type === 'team_invite_accepted' ||
    (notification.text?.includes('accepted your invitation') && notification.text?.includes('team')) ||
    (notification.text?.includes('joined the') && notification.text?.includes('team'))
  ) {
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}

    const orgId =
      (meta.orgId as string) ||
      (meta.org_id as string) ||
      (notification as any).recipient_company_id ||
      (notification as any).recipient_org_id ||
      notification.reference_id;
    let roleTarget = (meta.roleId as string) || (meta.role_id as string);
    if (!roleTarget && notification.text) {
      const match = notification.text.match(/joined the\s+(.+?)\s+team/i);
      if (match) {
        roleTarget = encodeURIComponent(match[1].trim());
      }
    }

    const orgQuery = orgId ? `?orgId=${orgId}` : '';
    if (roleTarget) {
      return `/team/role/${roleTarget}${orgId ? `?from=/notifications&orgId=${orgId}` : '?from=/notifications'}`;
    }
    return orgQuery ? `/team${orgQuery}` : '/team';
  }

  // Redirect approved / live job notification to /jobs dashboard with highlight
  if (
    type === 'job_approved' ||
    type === 'job_live' ||
    type === 'job_published' ||
    type === 'job_rejected' ||
    type === 'job_live' ||
    notification.text?.includes('is now live') ||
    /Your job.+?is now live/i.test(notification.text || '')
  ) {
    let jobId = notification.reference_id;
    if (!jobId) {
      try {
        if (typeof ext.metadata === 'string') {
          const parsed = JSON.parse(ext.metadata);
          jobId = parsed.jobId || parsed.job_id;
        } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
          jobId = (ext.metadata as any).jobId || (ext.metadata as any).job_id;
        }
      } catch {}
    }
    return jobId ? `/jobs?tab=My+Listings&jobId=${jobId}` : '/jobs?tab=My+Listings';
  }

  // Candidate personal notification: "You declined the offer from [Company] for [Job Title]"
  if (
    notification.text?.includes('declined the offer') ||
    notification.text?.includes('accepted the offer') ||
    /^You\s+(?:declined|accepted)\s+the offer/i.test(notification.text || '')
  ) {
    let meta: Record<string, any> = {};
    try {
      if (typeof ext.metadata === 'string') {
        meta = JSON.parse(ext.metadata);
      } else if (typeof ext.metadata === 'object' && ext.metadata !== null) {
        meta = ext.metadata as Record<string, any>;
      }
    } catch {}
    const jobId = (meta.job_id as string) || (meta.jobId as string) || notification.reference_id;
    return jobId ? `/jobs/${jobId}?returnTo=/notifications` : '/jobs';
  }

  // Redirect accepted/declined job offer notifications to offer details page
  if (
    type === 'job_offer_accepted' ||
    type === 'offer_accepted' ||
    notification.text?.includes('accepted your offer')
  ) {
    const offerJobId = notification.reference_id;
    return offerJobId ? `/jobs?view=offer-details&jobId=${offerJobId}` : '/jobs';
  }

  // Redirect declined job offer notification to offer details page for the corresponding job posting
  if (
    type === 'job_offer_declined' ||
    type === 'offer_declined' ||
    notification.text?.includes('declined your offer')
  ) {
    const offerJobId = notification.reference_id;
    return offerJobId ? `/jobs?view=offer-details&jobId=${offerJobId}` : '/jobs';
  }

  if (
    (type.includes('job') || type.includes('application') || type.includes('offer')) &&
    notification.reference_id
  ) {
    // SCRUM-1610: Append returnTo=/notifications so JobDetailPage back button cleanly returns to Notifications
    return `/jobs/${notification.reference_id}?returnTo=/notifications`;
  }
  if (type === 'community_invite') {
    return '/connections?tab=invitations&sub=channels';
  }
  if (type === 'organization_invite' || type === 'ORGANIZATION_INVITE') {
    return '/connections?tab=invitations&sub=teams';
  }
  if (
    type === 'password_changed' ||
    type === 'password_reset_requested' ||
    type === 'email_changed' ||
    notification.text?.toLowerCase().includes('password')
  ) {
    return '/settings/account';
  }
  if (
    type === 'new_device_login' ||
    notification.text?.toLowerCase().includes('login')
  ) {
    return '/settings/privacy';
  }
  if (
    type === 'profile_incomplete_nudge' ||
    notification.text?.toLowerCase().includes('complete your profile')
  ) {
    return isCompany && activeProfile?.slug
      ? `/organization/${activeProfile.slug}`
      : '/profile';
  }

  if (type === 'company_deactivated') {
    return '/settings/organizations';
  }

  if (type === 'company_deleted') {
    const meta = (notification.metadata as Record<string, unknown>) || {};
    const canRecover = Boolean(
      notification.can_recover ??
      notification.canRecover ??
      notification.is_owner ??
      notification.isOwner ??
      meta.can_recover ??
      meta.canRecover ??
      meta.is_owner ??
      meta.isOwner ??
      (currentUserId && (meta.owner_id === currentUserId || meta.ownerId === currentUserId))
    );
    // Only stakeholders who have the recover option (Owner) are redirected to settings/organizations.
    // Associated team members cannot recover the deleted company and should NOT be redirected anywhere.
    return canRecover ? '/settings/organizations' : null;
  }
  if (type === 'company_reactivated' || type === 'company_recovered') {
    const slug =
      notification.actor_slug ||
      ((notification.metadata as Record<string, unknown>)?.org_slug as string) ||
      ((notification.metadata as Record<string, unknown>)?.orgSlug as string);
    return slug ? `/organization/${slug}` : '/settings/organizations';
  }

  return null;
};