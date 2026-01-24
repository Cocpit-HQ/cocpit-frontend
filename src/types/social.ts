export interface ConnectionRequest {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender: {
        name: string;
        avatar: string | null;
        headline: string | null;
    };
    receiver?: {
        name: string;
        avatar: string | null;
    };
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
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
    type: 'connection_request' | 'connection_accepted' | 'like' | 'comment' | 'follow' | 'job_alert';
    actor_name: string;
    actor_avatar: string | null;
    reference_id: string | null;
    text: string;
    is_read: boolean;
    created_at: string;
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
