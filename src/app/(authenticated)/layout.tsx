import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ActiveProfileProvider } from "@/context/ActiveProfileContext";
import { DashboardActorGate } from "@/components/layout/DashboardActorGate";

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    return (
        <ActiveProfileProvider>
            <DashboardActorGate>
                {children}
            </DashboardActorGate>
        </ActiveProfileProvider>
    );
}
