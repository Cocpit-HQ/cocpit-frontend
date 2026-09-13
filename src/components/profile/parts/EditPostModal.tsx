"use client";

/**
 * =============================================================================
 * LEGACY / UNUSED COMPONENT (DEPRECATED)
 * This component was an unimported prototype and is no longer used.
 * The active implementation is `@/shared/commonComponents/EditPostModal`.
 * =============================================================================
 */

export { EditPostModal } from "@/shared/commonComponents/EditPostModal";
export default function LegacyPartsEditPostModal() {
    return null;
}

/* =============================================================================
 * ORIGINAL UNUSED IMPLEMENTATION (COMMENTED OUT)
 * =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { X, Search, ChevronLeft, UserPlus, MapPin, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import useEmblaCarousel from "embla-carousel-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { updatePost, syncPostTags } from "@/services/api/posts";
import { searchUsers, getSuggestedUsers, UserMention } from "@/services/api/users";
import { searchLocations, LocationSuggestion } from "@/services/api/location";
import { toast } from "sonner";
import debounce from "lodash.debounce";
import { Post } from "@/types/entities";
import { cn } from "@/lib/utils";
import { mapBackendPostToFrontend } from "@/lib/mappers/feed.mapper";
import { CocpitSelectedUserChips } from "@/shared/commonComponents/CocpitSelectedUserChips";
import { POPULAR_LOCATIONS } from "@/data/staticLocations";
import { parseMentionsForFrontend, formatMentionsForBackend } from "@/lib/mentions";

// Legacy parts EditPostModal code preserved in archive
============================================================================= */
