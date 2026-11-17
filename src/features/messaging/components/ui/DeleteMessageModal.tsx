
import React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteMessageModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onDeleteForMe: () => void
    onDeleteForEveryone?: () => void
    isSender: boolean
    count?: number
}

export function DeleteMessageModal({
    open,
    onOpenChange,
    onDeleteForMe,
    onDeleteForEveryone,
    isSender,
    count = 1
}: DeleteMessageModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-[24px] rounded-b-none bg-[var(--ds-bg)] border border-[var(--ds-border)] text-[var(--ds-text-primary)] p-6 md:left-[50%] md:top-[50%] md:right-auto md:bottom-auto md:translate-x-[-50%] md:translate-y-[-50%] md:max-w-sm md:rounded-2xl animate-in slide-in-from-bottom duration-300 md:zoom-in-95 md:duration-200">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[var(--ds-text-primary)] font-['DM_Sans'] text-lg font-semibold">
                        Delete {count > 1 ? `${count} Messages` : "Message"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[var(--ds-text-muted)] font-['DM_Sans'] text-sm">
                        Choose how you want to delete {count > 1 ? "these messages" : "this message"}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2 py-2">
                    {isSender && (
                        <Button
                            className="w-full justify-start pl-4 bg-[var(--ds-error)] hover:bg-[var(--ds-error)]/90 text-white border-none font-['DM_Sans']"
                            onClick={() => {
                                onDeleteForEveryone?.()
                                onOpenChange(false)
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete for everyone
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="w-full justify-start pl-4 border-[var(--ds-border)] text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-1)] font-['DM_Sans']"
                        onClick={() => {
                            onDeleteForMe()
                            onOpenChange(false)
                        }}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete for me
                    </Button>
                </div>
                <AlertDialogFooter className="sm:justify-center">
                    <AlertDialogCancel
                        onClick={() => onOpenChange(false)}
                        className="w-full mt-0 bg-transparent border-[var(--ds-border)] text-[var(--ds-text-secondary)] hover:bg-[var(--ds-surface-1)] hover:text-[var(--ds-text-primary)] font-['DM_Sans']"
                    >
                        Cancel
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
