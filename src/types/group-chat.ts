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
}
