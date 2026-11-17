export interface GroupDetails {
    conversation_id: string;
    conversation_name: string;
    headline?: string;
    description?: string;
    group_headline?: string;
    group_avatar?: string;
    admin_id: string;
    created_at: string;
    members: GroupMember[];
    is_inactive?: boolean;
    was_removed?: boolean;
    left_at?: string | null;
}

export interface GroupMember {
    user_id: string;
    account_name: string;
    full_name: string;
    avatar_url?: string;
    headline?: string;
    joined_at: string;
    role: 'admin' | 'member'; // Added role
    left_at?: string | null;
    isPending?: boolean;
    status?: 'accepted' | 'pending';
    invitation_id?: string;
    is_blocked?: boolean;
    is_blocked_by_me?: boolean;
    is_blocked_by_other?: boolean;
    is_deactivated?: boolean;
    is_deleted?: boolean;
    is_unavailable?: boolean;
    org_name?: string;
    org_logo?: string;
}

export interface Invitation {
    invitation_id: string;
    group_id: string;
    sender_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export interface GroupInvitation {
    invitation_id: string;
    invitee_id: string;
    invitee_name: string;
    invitee_avatar: string;
    status: 'pending' | 'accepted' | 'rejected';
    sent_at?: string;
}

export interface CreateGroupPayload {
    name: string;
    description?: string;
    members: string[]; // user IDs
    avatar?: File | null;
}

export interface SharedMediaItem {
    media_id: string;
    url: string;
    media_type: 'image' | 'video' | 'document' | string;
    filename?: string | null;
    created_at?: string;
    message_id?: string;
}

export interface SharedPostItem {
    post_id: string;
    caption?: string | null;
    title?: string | null;
    post_type?: string;
    created_at?: string;
    author_id?: string;
    author_name?: string;
    author_avatar?: string | null;
    media?: Array<{ url: string; media_type?: string }>;
    poll?: {
        question?: string;
        options?: Array<{ option_id?: string; option_text?: string; text?: string }>;
    } | null;
    shared_at?: string;
    message_id?: string;
}

export interface SharedLinkItem {
    id: string;
    message_id?: string;
    url: string;
    domain: string;
    title?: string;
    created_at?: string;
}

export interface GroupSharedContent {
    media: SharedMediaItem[];
    posts: SharedPostItem[];
    links: SharedLinkItem[];
}
