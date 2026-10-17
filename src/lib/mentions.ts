import { UserMention } from "@/services/api/users";

/**
 * Helper to check if a string is a valid UUID v4 format.
 * Used to distinguish immutable user IDs (UUIDs) from legacy account_name handles.
 */
const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

/**
 * Parses raw text containing mention tags (e.g. `@[John Doe](uuid)` or `@[John Doe](username)`)
 * into plain display content and an array of inline mention user objects for UI text editors.
 * 
 * @param content Raw content string stored in backend or state
 * @returns Object with parsed content and extracted inlineMentions list
 */
export const parseMentionsForFrontend = (content: string) => {
    if (!content) return { content: "", inlineMentions: [] };

    let parsedContent = content;
    const inlineMentions: UserMention[] = [];

    // Match structured mention syntax: @[Full Name](handle_or_uuid)
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const fullName = match[1];
        const identifier = match[2];
        
        const isId = isUUID(identifier);

        inlineMentions.push({
            id: isId ? identifier : Math.random().toString(), // Use immutable user_id if valid UUID, else generate temporary ID
            full_name: fullName,
            account_name: isId ? '' : identifier, // Fallback to account_name for legacy username-based mentions
            avatar_url: ""
        });
    }

    // Replace structured tags with hidden zero-width space marker + full name for editor visualization
    parsedContent = parsedContent.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '\u200B$1');

    return {
        content: parsedContent,
        inlineMentions
    };
};

/**
 * Converts editor content containing zero-width marked mentions back into backend storage format: `@[FullName](user_id)`.
 * Prefers the immutable `user_id` (UUID) to ensure mentions remain functional even if the user updates their username or name.
 * 
 * @param content Draft content from text input/editor
 * @param inlineMentions Array of user mentions selected during editing
 * @returns Formatted content string ready to be saved to backend database
 */
export const formatMentionsForBackend = (content: string, inlineMentions: UserMention[]) => {
    let finalContent = content;
    
    if (inlineMentions.length > 0) {
        inlineMentions.forEach(mention => {
            // Escape special regex characters in the user's name
            const escapedName = mention.full_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Locate occurrences prefixed with our zero-width space hidden marker (\u200B)
            const regex = new RegExp(`\u200B${escapedName}`, 'g');
            
            // Always prefer immutable UUID user_id as the stable identifier; fallback to account_name for legacy unedited mentions
            const stableIdentifier = mention.id && isUUID(mention.id) ? mention.id : mention.account_name;
            
            // Format tag as @[Full Name](user_id)
            finalContent = finalContent.replace(regex, `@[${mention.full_name}](${stableIdentifier})`);
        });
        
        // Clean up any remaining zero-width spaces left behind by partial edits or deletions
        finalContent = finalContent.replace(/\u200B/g, '');
    }

    return finalContent;
};

