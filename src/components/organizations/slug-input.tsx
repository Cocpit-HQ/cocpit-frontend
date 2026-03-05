import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCheckSlug } from "@/components/organizations/hooks/use-company";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface SlugInputProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onStatusChange: (isValid: boolean) => void;
    suggestion?: string; // Auto-generated suggestion from name
    label?: string;
    description?: string;
}

export function SlugInput({ id = "slug", value, onChange, onStatusChange, suggestion, label, description }: SlugInputProps) {
    const [touched, setTouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const checkSlugMutation = useCheckSlug();

    // Auto-update if suggestion changes and user hasn't touched input yet
    useEffect(() => {
        if (suggestion && !touched && !value) {
            onChange(suggestion);
        }
    }, [suggestion, touched, value, onChange]);

    // Debounce check
    useEffect(() => {
        const check = async () => {
            if (!value) {
                setIsAvailable(null);
                setError(null);
                onStatusChange(false);
                return;
            }

            // Client-side regex check first
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
                setError("Slug must be lowercase, alphanumeric, and hyphen-separated.");
                setIsAvailable(false);
                onStatusChange(false);
                return;
            }

            if (value.length < 3) {
                setError("Slug must be at least 3 characters.");
                setIsAvailable(false);
                onStatusChange(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const available = await checkSlugMutation.mutateAsync(value);
                setIsAvailable(available);
                if (!available) setError("This URL is already taken.");
                onStatusChange(available);
            } catch (err: any) {
                // Use backend error message if available
                const msg = err.response?.data?.message || err.message || "Failed to check availability.";
                setError(msg);
                setIsAvailable(false);
                onStatusChange(false);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(check, 500);
        return () => clearTimeout(timeoutId);
    }, [value]);

    return (
        <div className="space-y-2">
            {label && (
                <Label htmlFor={id} className="text-sm font-medium leading-none">
                    {label}
                </Label>
            )}
            {description && (
                <p className="text-[0.8rem] text-muted-foreground">
                    {description}
                </p>
            )}

            <div className={`
                relative flex items-center w-full rounded-md border bg-background transition-all
                ${isAvailable === false ? "border-red-500 ring-1 ring-red-500" :
                    isAvailable === true ? "border-green-500 ring-1 ring-green-500" :
                        "border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary"}
            `}>
                <div className="flex items-center h-10 px-3 text-sm text-muted-foreground bg-muted/30 border-r rounded-l-md font-mono select-none">
                    cocpit.com/organization/
                </div>
                <Input
                    id={id}
                    value={value}
                    onChange={(e) => {
                        setTouched(true);
                        onStatusChange(false);
                        onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 h-10 font-mono text-sm bg-transparent"
                    placeholder="acme-inc"
                    autoComplete="off"
                />
                <div className="pr-3 flex items-center">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isAvailable === true ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : isAvailable === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                </div>
            </div>

            {error && (
                <p className="text-[0.8rem] font-medium text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1 fade-in-0">
                    <XCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
            {isAvailable === true && (
                <p className="text-[0.8rem] font-medium text-green-500 flex items-center gap-1 animate-in slide-in-from-top-1 fade-in-0">
                    <CheckCircle2 className="h-3 w-3" />
                    URL is available
                </p>
            )}
        </div>
    );
}
