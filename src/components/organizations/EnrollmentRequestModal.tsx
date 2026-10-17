"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { useRequestEnrollment } from "@/components/organizations/hooks/use-company";
import { Loader2 } from "lucide-react";

interface EnrollmentRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    orgName: string;
}

const DEPARTMENT_OPTIONS = [
    { label: "Computer Science", value: "Computer Science" },
    { label: "Engineering", value: "Engineering" },
    { label: "Business", value: "Business" },
    { label: "Arts & Humanities", value: "Arts & Humanities" },
    { label: "Sciences", value: "Sciences" },
    { label: "Medicine", value: "Medicine" },
    { label: "Law", value: "Law" },
    { label: "Other", value: "Other" },
];

export function EnrollmentRequestModal({ isOpen, onClose, orgId, orgName }: EnrollmentRequestModalProps) {
    const [department, setDepartment] = useState("");
    const [batchYear, setBatchYear] = useState("");
    const [enrollmentNumber, setEnrollmentNumber] = useState("");

    const enrollmentMutation = useRequestEnrollment();

    const currentYear = new Date().getFullYear();
    const batchYearOptions = Array.from({ length: 10 }, (_, i) => ({
        label: `${currentYear - 5 + i}`,
        value: `${currentYear - 5 + i}`
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await enrollmentMutation.mutateAsync({
            orgId,
            data: {
                department: department || undefined,
                batch_year: batchYear ? parseInt(batchYear) : undefined,
                enrollment_number: enrollmentNumber || undefined
            }
        });

        onClose();
        // Reset form
        setDepartment("");
        setBatchYear("");
        setEnrollmentNumber("");
    };

    const isFormValid = !!department && !!batchYear;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join {orgName}</DialogTitle>
                    <DialogDescription>
                        Request to join this institution as a student. Your request will be reviewed by an administrator.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <SelectField
                        id="department"
                        label="Department / Major"
                        value={department}
                        onChange={setDepartment}
                        options={DEPARTMENT_OPTIONS}
                        required={true}
                    />

                    <SelectField
                        id="batchYear"
                        label="Batch Year / Class of"
                        value={batchYear}
                        onChange={setBatchYear}
                        options={batchYearOptions}
                        required={true}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="enrollmentNumber">Student ID / Enrollment Number (Optional)</Label>
                        <Input
                            id="enrollmentNumber"
                            placeholder="e.g. STU12345"
                            value={enrollmentNumber}
                            onChange={(e) => setEnrollmentNumber(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={enrollmentMutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isFormValid || enrollmentMutation.isPending}>
                            {enrollmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
