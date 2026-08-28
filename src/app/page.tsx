import { Suspense } from "react";
import { LoginForm, AuthSidebarLinks } from "@/features/auth";
import { CocpitLogoIcon } from "@/components/icons";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user && session.user.onboarding_complete) {
    redirect("/feed");
  }

  return (
    <main
      data-theme="dark"
      className="min-h-screen w-full bg-[#030303] text-[#FFECE6] relative flex items-center justify-center overflow-x-hidden font-['DM_Sans',sans-serif]"
    >
      {/* Left Sidebar Navigation (Desktop: 40px from left edge, vertically centered) */}
      <div className="hidden lg:block absolute left-[40px] top-1/2 -translate-y-1/2 z-10">
        <AuthSidebarLinks />
      </div>

      {/* Main Centered Login Section (Horizontally & Vertically Centered) */}
      <div className="w-full flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[384px] flex flex-col items-center">
          <Suspense fallback={<div className="h-96 w-full animate-pulse bg-[#1A1A20] rounded-3xl" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Mobile/Tablet Bottom Navigation Links */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full px-4 py-4 bg-[#030303]/90 backdrop-blur-md border-t border-zinc-900 flex justify-center z-10">
        <AuthSidebarLinks isMobile />
      </div>

      {/* Bottom Right Company Logo Mark */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-10 pointer-events-auto">
        <Link
          href="https://cocpit.in"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cocpit"
          className="block relative text-[#FFECE6] hover:opacity-80 transition-opacity"
        >
          <CocpitLogoIcon className="w-[27px] h-[30px]" />
        </Link>
      </div>
    </main>
  );
}