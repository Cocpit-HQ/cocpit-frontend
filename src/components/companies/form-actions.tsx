import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormActionsProps {
    isLoading: boolean;
    isDisabled: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
}

export function FormActions({
    isLoading,
    isDisabled,
    submitLabel = "Submit",
    cancelLabel = "Cancel",
    onCancel
}: FormActionsProps) {
    return (
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            {onCancel && (
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-8"
                    onClick={onCancel}
                >
                    {cancelLabel}
                </Button>
            )}
            <Button
                type="submit"
                className="h-11 px-8 min-w-[140px]"
                disabled={isDisabled || isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                    </>
                ) : submitLabel}
            </Button>
        </div>
    );
}
