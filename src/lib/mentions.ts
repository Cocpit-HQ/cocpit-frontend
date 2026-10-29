import { UserMention } from "@/services/api/users";

/**
 * Helper to check if a string is a valid UUID v4 format.
 * Used to distinguish immutable user IDs (UUIDs) from legacy account_name handles.
 */
export const isUUID = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

/**
 * Parses raw text containing mention tags (e.g. `@[John Doe](user:uuid)`, `@[Acme](org:uuid)`, or legacy `@[John Doe](uuid)`)
 * into plain display content and an array of inline mention user objects for UI text editors.
 * 
 * @param content Raw content string stored in backend or state
 * @returns Object with parsed content and extracted inlineMentions list
 */
export const parseMentionsForFrontend = (content: string) => {
    if (!content) return { content: "", inlineMentions: [] };

    let parsedContent = content;
    const inlineMentions: UserMention[] = [];

    // Match structured mention syntax: @[Full Name](type:uuid) or legacy @[Full Name](handle_or_uuid)
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const fullName = match[1];
        const rawIdentifier = match[2];

        const prefixMatch = rawIdentifier.match(/^(user|org|company):(.+)$/i);
        const entityType = prefixMatch ? prefixMatch[1].toLowerCase() : null;
        const cleanIdentifier = prefixMatch ? prefixMatch[2] : rawIdentifier;
        
        const isId = isUUID(cleanIdentifier);
        const isCompany = entityType === 'org' || entityType === 'company';

        inlineMentions.push({
            id: isId ? cleanIdentifier : Math.random().toString(), // Use immutable user_id if valid UUID, else generate temporary ID
            full_name: fullName,
            account_name: isId ? '' : cleanIdentifier, // Fallback to account_name for legacy username-based mentions
            is_company: isCompany,
            type: isCompany ? 'COMPANY' : 'USER',
            org_id: isCompany ? cleanIdentifier : undefined,
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
 * Converts editor content containing zero-width marked mentions back into backend storage format: `@[FullName](type:user_id)`.
 * Prefers the immutable `user_id` (UUID) with explicit type prefix (`user:` or `org:`) so clients can route immediately without extra API lookups.
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
            
            const isOrg = Boolean(
                mention.is_company || 
                mention.type === 'COMPANY' || 
                mention.type === 'INSTITUTION' || 
                mention.account_type === 'COMPANY' || 
                mention.account_type === 'INSTITUTION' || 
                mention.org_id
            );
            const prefix = isOrg ? 'org:' : 'user:';

            // Always prefer immutable UUID user_id as the stable identifier; fallback to account_name for legacy unedited mentions
            const stableIdentifier = mention.id && isUUID(mention.id) ? `${prefix}${mention.id}` : mention.account_name;
            
            // Format tag as @[Full Name](type:user_id)
            finalContent = finalContent.replace(regex, `@[${mention.full_name}](${stableIdentifier})`);
        });
        
        // Clean up any remaining zero-width spaces left behind by partial edits or deletions
        finalContent = finalContent.replace(/\u200B/g, '');
    }

    return finalContent;
};
