"use client";

import { usePendingEnrollments, useReviewEnrollment } from "@/components/organizations/hooks/use-company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function EnrollmentManagement({ company }: { company: any }) {
    const { data: enrollments = [], isLoading } = usePendingEnrollments(company.company_id);
    const reviewMutation = useReviewEnrollment();

    // The backend returns an array of enrollment objects which join with the user table
    // Expected fields based on our backend queries: enrollment_id, user_id, status, department, batch_year, enrollment_number, created_at
    // Plus joined fields: user_full_name, user_email

    const handleReview = (enrollmentId: string, status: 'VERIFIED' | 'REJECTED') => {
        reviewMutation.mutate({
            orgId: company.company_id,
            enrollmentId,
            status
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (enrollments.length === 0) {
        return (
            <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mb-4 opacity-50 text-green-500" />
                    <p className="font-medium text-foreground">No pending enrollments</p>
                    <p className="text-sm mt-1">You're all caught up! There are no student enrollment requests awaiting review.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {enrollments.map((enrollment: any) => (
                <Card key={enrollment.enrollment_id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="text-lg">{enrollment.user_full_name || 'Unknown User'}</CardTitle>
                                <CardDescription className="mt-1">
                                    Requested {formatDistanceToNow(new Date(enrollment.created_at), { addSuffix: true })}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                                    onClick={() => handleReview(enrollment.enrollment_id, 'REJECTED')}
                                    disabled={reviewMutation.isPending}
                                >
                                    <XCircle className="h-4 w-4 mr-1.5" />
                                    Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleReview(enrollment.enrollment_id, 'VERIFIED')}
                                    disabled={reviewMutation.isPending}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1.5" />
                                    Approve
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Department</p>
                            <p className="font-medium">{enrollment.department || 'Not specified'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Batch Year</p>
                            <p className="font-medium">{enrollment.batch_year || 'Not specified'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Student ID</p>
                            <p className="font-medium font-mono">{enrollment.enrollment_number || 'None provided'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Email</p>
                            <p className="font-medium truncate" title={enrollment.user_email}>{enrollment.user_email || 'Not specified'}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
