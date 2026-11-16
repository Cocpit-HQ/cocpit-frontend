export const JOB_TABS = {
  EXPLORE: "Explore",
  SAVED: "Saved",
  APPLICATIONS: "My Applications",
  OFFERS: "Offers",
} as const;

export type JobTabType = (typeof JOB_TABS)[keyof typeof JOB_TABS];

export const RECRUITER_TABS = {
  LISTINGS: "listings",
  DRAFTS: "drafts",
  SEND_OFFER: "send-offer",
} as const;

export const JOB_STATUS_COLORS: Record<string, string> = {
  applied: "bg-ds-surface-2 border border-ds-border text-ds-text-secondary",
  shortlisted: "bg-ds-surface-2 border border-ds-success/40 text-ds-success",
  "in-review": "bg-ds-surface-2 border border-ds-warning/40 text-ds-warning",
  declined: "bg-ds-surface-2 border border-ds-error/40 text-ds-error",
  accepted: "bg-ds-surface-2 border border-ds-success/40 text-ds-success",
  offer: "bg-ds-surface-2 border border-ds-accent/40 text-ds-accent",
  withdrawn: "bg-ds-surface-2 border border-ds-border text-ds-text-muted",
};

export const getStatusBgClass = (status: string = "") => {
  switch (status.toLowerCase()) {
    case "applied":
    case "shortlisted":
    case "in-review":
    case "declined":
    default:
      return "bg-ds-surface-2";
  }
};
