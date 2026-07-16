import React from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmAction {
    type: "unfollow" | "remove_follower" | "remove_subscriber";
    id: string;
    name: string;
    entityType?: string;
}

interface PeopleActionDialogProps {
    confirmAction: ConfirmAction | null;
    isPending: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const PeopleActionDialog: React.FC<PeopleActionDialogProps> = ({
    confirmAction,
    isPending,
    onClose,
    onConfirm,
}) => {
    const getDialogContent = () => {
        if (!confirmAction) return null;

        switch (confirmAction.type) {
            case "unfollow":
                return {
                    title: "Unfollow this account?",
                    desc: "You will stop seeing their posts in your feed.",
                    actionText: "Unfollow",
                };
            case "remove_follower":
                return {
                    title: "Remove follower?",
                    desc: "This person will no longer follow you or see your updates in their feed.",
                    actionText: "Remove",
                };
            case "remove_subscriber":
                return {
                    title: "Remove subscriber?",
                    desc: "This subscriber will no longer receive updates from your channel",
                    actionText: "Remove",
                };
            default:
                return null;
        }
    };

    const dialogContent = getDialogContent();

    return (
        <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && !isPending && onClose()}>
            <AlertDialogContent className="sm:max-w-[400px] rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center text-lg font-semibold">
                        {dialogContent?.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-zinc-500">
                        {dialogContent?.desc}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row items-center justify-center sm:justify-center gap-4 mt-6">
                    <AlertDialogCancel
                        className="mt-0 rounded-full w-28 border-[#1A73E8] text-[#1A73E8] hover:bg-blue-50"
                        disabled={isPending}
                        onClick={onClose}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        className="rounded-full w-28 bg-[#EF4444] hover:bg-[#DC2626]"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {dialogContent?.actionText}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
