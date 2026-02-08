
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
            <AlertDialogContent className="max-w-xs sm:max-w-sm rounded-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Choose how you want to delete this message.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2 py-2">
                    {isSender && (
                        <Button
                            variant="destructive"
                            className="w-full justify-start pl-4"
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
                        className="w-full justify-start pl-4 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
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
                    <AlertDialogCancel onClick={() => onOpenChange(false)} className="w-full mt-0">
                        Cancel
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
