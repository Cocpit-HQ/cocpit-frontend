import { Message } from "@/types/messaging";

interface SystemMessageProps {
    message: Message;
    currentUserId: string;
}

export default function SystemMessage({ message, currentUserId }: SystemMessageProps) {
    const { text, senderId, action_type, target_id } = message;

    let displayText = text;

    if (action_type === 'leave') {
        const isMe = senderId === currentUserId;
        if (isMe) {
            displayText = "You left the group";
        }
    } else if (action_type === 'add') {
        const isTargetMe = target_id === currentUserId;
        const isSenderMe = senderId === currentUserId;

        if (isTargetMe) {
            // "You were added" (sender usually invited, but simplistic view: just "You were added")
            // or "Sender added You"
            // If sender is NOT me (checking senderId against currentUserId), we could say "Sender added You".
            // But existing text is "X was added".
            // Let's stick to "You were added to the group" as per request requirements unless sender info needed.
            displayText = "You were added to the group";
        } else if (isSenderMe) {
            // "You added Target"
            // Not strictly requested but good for "WhatsApp-style".
            // Requirement: "Else -> TargetName was added"
            // So if I added someone, I still see "TargetName was added"?
            // Request says: "If currentUser.id === target_user_id -> Show 'You were added'. Else -> 'Username was added'"
            // It doesn't explicitly ask for "You added Username".
        }
    } else if (action_type === 'remove') {
        const isTargetMe = target_id === currentUserId;
        if (isTargetMe) {
            displayText = "You were removed from the group";
        }
    } else if (action_type === 'create_group') {
        const isMe = senderId === currentUserId;
        if (isMe) {
            // Extract group name from message text or use generic
            // Format: "Name created the group "GroupName""
            const groupNameMatch = text.match(/created the group "(.*)"/);
            const groupName = groupNameMatch ? groupNameMatch[1] : "this group";
            displayText = `You created the group "${groupName}"`;
        }
    } else if (action_type === 'update_avatar') {
        const isMe = senderId === currentUserId;
        if (isMe) {
            displayText = "You updated the group icon";
        }
    }

    return (
        <div className="flex justify-center my-4">
            <span className="bg-muted/50 text-muted-foreground text-xs px-3 py-1 rounded-full border border-border/50">
                {displayText}
            </span>
        </div>
    );
}
