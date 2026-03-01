
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    registerForEvent,
    unregisterFromEvent,
    saveEvent,
    unsaveEvent,
    createEvent,
    updateEvent,
    deleteEvent
} from "@/services/api/event";
import { eventKeys } from "./use-event-queries";
import { RegisterEventPayload } from "@/types/event";

export function useEventActions() {
    const queryClient = useQueryClient();

    // --- Registration ---
    const registerMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string | number; payload: RegisterEventPayload }) =>
            registerForEvent(id, payload),
        onSuccess: (_, { id }) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: eventKeys.registered });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
            // Optimistic updates could be done here, but invalidation is safer for complex status
        }
    });

    const unregisterMutation = useMutation({
        mutationFn: (id: string | number) => unregisterFromEvent(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.registered });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
        }
    });

    // --- Saves ---
    const saveMutation = useMutation({
        mutationFn: (id: string | number) => saveEvent(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.saved });
            // Also potentially update feed item "isSaved" status via setQueryData?
            // For now invalidation of 'saved' list is key.
            // Modifying the infinite feed data is complex but possible.
        }
    });

    const unsaveMutation = useMutation({
        mutationFn: (id: string | number) => unsaveEvent(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.saved });
        }
    });

    // --- CRUD ---
    const createMutation = useMutation({
        mutationFn: (formData: FormData) => createEvent(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all }); // Refresh feeds
            queryClient.invalidateQueries({ queryKey: eventKeys.myEvents });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: string | number; formData: FormData }) =>
            updateEvent(id, formData),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: eventKeys.myEvents });
            queryClient.invalidateQueries({ queryKey: eventKeys.feed({}) }); // Might be aggressive
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
        }
    });

    return {
        register: registerMutation,
        unregister: unregisterMutation,
        save: saveMutation,
        unsave: unsaveMutation,
        create: createMutation,
        update: updateMutation,
        delete: deleteMutation,
    };
}
