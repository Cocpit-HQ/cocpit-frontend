// src/features/connection/types.ts

export type ConnectionTab = 'received' | 'sent' | 'invitations';
export type InvitationSubTab = 'teams' | 'channels';

export interface MutualInfo {
  count:   number;
  avatars: string[];
}

export interface ConnectionRequestUser {
  name:      string;
  avatar:    string;      // raw URL from backend (backend key is 'avatar')
  headline:  string;
  slug:      string | null;
}

export interface ConnectionRequest {
  id:               string;
  sender_id:        string;
  receiver_id:      string;
  created_at:       string;
  status:           'pending';
  reason_tag:       string | null;
  isCompanyRequest: boolean;
  mutuals:          MutualInfo;
  /** The OTHER person: sender if this is a received request, recipient if this is a sent request */
  user:             ConnectionRequestUser;
}

export interface ConnectionRequestsResponse {
  data:       ConnectionRequest[];
  totalCount: number;
  page:       number;
  limit:      number;
}

export interface ConnectionCounts {
  received:            number;
  sent:                number;
  invitations?:        number;
  teamsInvitations?:   number;
  channelsInvitations?: number;
}

export type SuggestionReasonSignal = 'mutual' | 'company' | 'skill' | 'city' | null;

export interface SuggestedUser {
  id:            string;
  name:          string;
  avatarUrl:     string;
  headline:      string;
  reasonSignal:  SuggestionReasonSignal;
  mutuals:       MutualInfo;
  worksAt:       string | null;
  studiedAt:     string | null;
  sharedSkills:  string[];   // populated when reasonSignal === 'skill'
}

export interface SuggestionsResponse {
  data: SuggestedUser[];
}
