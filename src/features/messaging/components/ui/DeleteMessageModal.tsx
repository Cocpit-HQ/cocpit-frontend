
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
}

export function DeleteMessageModal({
    open,
    onOpenChange,
    onDeleteForMe,
    onDeleteForEveryone,
    isSender
}: DeleteMessageModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-[24px] rounded-b-none bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] p-6 md:left-[50%] md:top-[50%] md:right-auto md:bottom-auto md:translate-x-[-50%] md:translate-y-[-50%] md:max-w-sm md:rounded-xl animate-in slide-in-from-bottom duration-300 md:zoom-in-95 md:duration-200">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[var(--foreground)]">Delete Message?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[var(--muted-foreground)]">
                        Choose how you want to delete this message.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2 py-2">
                    {isSender && (
                        <Button
                            className="w-full justify-start pl-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] border-none"
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
                        className="w-full justify-start pl-4 border-[var(--primary)]/30 text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--foreground)]"
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
                        className="w-full mt-0 bg-transparent border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                        Cancel
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
