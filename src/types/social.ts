export interface ConnectionRequest {
    id: string;
    sender_id: string;
    receiver_id: string;
    created_at: string;
    updated_at?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'connected' | 'blocked';
    direction?: 'incoming' | 'outgoing';
    isCompanyRequest?: boolean;
    otherUser?: {
        name: string;
        avatar: string | null;
        headline?: string;
    };
    sender: {
        name: string;
        avatar: string | null;
        headline?: string | null;
        slug?: string | null;
    };
}

export interface Connection {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
    connected_at: string;
}

export interface Notification {
    notification_id: string;
    user_id: string; // recipient
    sender_id: string; // actor
    type: 'connection_request' | 'connection_accepted' | 'like' | 'comment' | 'follow' | 'job_alert' | 'repost' | 'mention' | 'reply' | 'advocacy' | 'company_invite' | 'company_job' | 'company_event' | 'company_post' | 'profile_share';
    actor_name: string;
    actor_avatar: string | null;
    actor_slug?: string;
    is_company_actor?: boolean;
    reference_id: string | null;
    text: string;
    is_read: boolean;
    created_at: string;
    metadata?: any; // For flexible payload like comment_id
    request_id?: string;
    request_status?: string;
}

export interface CompanyNotificationPreferences {
    events_enabled: boolean;
    jobs_enabled: boolean;
    posts_enabled: boolean;
    is_default?: boolean;
    updated_at?: string;
}


export interface Follower {
    follower_id: string;
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
    is_following_back: boolean;
}

export interface Following {
    following_id: string;
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
}

export interface RelationshipStatus {
    status: 'me' | 'connected' | 'pending_sent' | 'pending_received' | 'cooldown' | 'blocked' | 'none';
    is_following: boolean;
    is_followed_by: boolean;
    request_id: string | null;
    sender?: string;
}
