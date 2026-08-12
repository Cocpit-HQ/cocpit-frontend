import { UserMention } from "@/services/api/users";

export const parseMentionsForFrontend = (content: string) => {
    if (!content) return { content: "", inlineMentions: [] };

    let parsedContent = content;
    const inlineMentions: UserMention[] = [];

    // Match @[Full Name](account_name)
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const fullName = match[1];
        const accountName = match[2];

        inlineMentions.push({
            id: Math.random().toString(), // Temporary ID for parsing
            full_name: fullName,
            account_name: accountName,
            avatar_url: ""
        });
    }

    // Replace structured mentions with the hidden marker format for the UI
    parsedContent = parsedContent.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '\u200B$1');

    return {
        content: parsedContent,
        inlineMentions
    };
};

export const formatMentionsForBackend = (content: string, inlineMentions: UserMention[]) => {
    let finalContent = content;
    
    if (inlineMentions.length > 0) {
        inlineMentions.forEach(mention => {
            // Escape special characters in the name just in case
            const escapedName = mention.full_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Look only for names that have our zero-width space hidden marker
            const regex = new RegExp(`\u200B${escapedName}`, 'g');
            finalContent = finalContent.replace(regex, `@[${mention.full_name}](${mention.account_name})`);
        });
        
        // Clean up any orphaned zero-width spaces left behind if someone partially deleted a name
        finalContent = finalContent.replace(/\u200B/g, '');
    }

    return finalContent;
};
