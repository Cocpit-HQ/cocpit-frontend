import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectOption {
    label: string;
    value: string;
}

interface SelectFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export function SelectField({
    id,
    label,
    value,
    onChange,
    options,
    placeholder = "Select an option",
    className,
    required
}: SelectFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor={id} className="text-sm font-medium leading-none">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id} className="h-11">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
