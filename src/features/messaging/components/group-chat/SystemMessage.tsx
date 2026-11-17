import { Message } from "@/types/messaging";
import { useAuth } from "@/hooks/use-auth";

interface SystemMessageProps {
    message: Message;
    currentUserId: string;
}

export default function SystemMessage({ message, currentUserId }: SystemMessageProps) {
    const { text, senderId, action_type, target_id } = message;
    const { user } = useAuth();

    let displayText = text;
    const myId = currentUserId || user?.id;
    const isSenderMe = Boolean(senderId && myId && String(senderId) === String(myId));
    const isTargetMe = Boolean(target_id && myId && String(target_id) === String(myId));
    const isNameMe = Boolean(user?.name && text.toLowerCase().startsWith(user.name.toLowerCase()));

    if (action_type === 'leave') {
        if (isSenderMe || isTargetMe || isNameMe) displayText = "You left the group";
    } else if (action_type === 'add') {
        if (isTargetMe || isNameMe) displayText = "You were added to the group";
    } else if (action_type === 'remove') {
        if (isTargetMe || isNameMe) displayText = "You were removed from the group";
    } else if (action_type === 'promote') {
        if (isTargetMe || isNameMe) displayText = "You were promoted to admin";
    } else if (action_type === 'create_group') {
        if (isSenderMe || isTargetMe || isNameMe) {
            const groupNameMatch = text.match(/created the group "(.*)"/);
            const groupName = groupNameMatch ? groupNameMatch[1] : "this group";
            displayText = `You created the group "${groupName}"`;
        }
    } else if (action_type === 'update_avatar') {
        if (isSenderMe || isNameMe) displayText = "You updated the group icon";
    }

    return (
        <div className="w-full flex justify-center items-center py-2 shrink-0 self-stretch my-2">
            <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-[var(--ds-text-secondary)] flex items-center justify-center">
                {displayText}
            </span>
        </div>
    );
}
