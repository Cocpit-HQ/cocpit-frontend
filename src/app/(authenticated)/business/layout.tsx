"use client"

import React from 'react'
import { BusinessSidebar } from '@/components/business/BusinessSidebar'
import { SocketProvider } from "@/context/SocketContext";
import { SocialProvider } from "@/context/SocialContext";
import { StoriesProvider } from "@/context/StoriesContext";

import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useRouter, usePathname } from 'next/navigation'

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCompany, isLoading } = useActiveProfile()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    // Temporarily disabled for UI exploration as requested
    /*
    if (!isLoading && !isCompany && !pathname.includes('/create-company')) {
        router.replace('/feed')
    }
    */
  }, [isCompany, isLoading, router, pathname])

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#020617] text-white font-bold uppercase tracking-widest animate-pulse">
            Loading Suite...
        </div>
    )
  }

  const isCreatePage = pathname.includes('/create-company')

  // Temporarily bypass render guard for UI exploration
  // if (!isCompany && !isCreatePage) return null;

  return (
    <SocketProvider>
      <SocialProvider>
        <StoriesProvider enabled={false}>
          <div className="relative flex min-h-screen bg-[#020617] text-white">
            <BusinessSidebar />
            <main className="flex-1 md:ml-64 relative bg-[#020617]">
              {/* Background glow effects */}
              <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#818cf8]/5 blur-[120px] pointer-events-none rounded-full" />
              <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
              
              <div className="relative z-10 p-12">
                {children}
              </div>
            </main>
          </div>
        </StoriesProvider>
      </SocialProvider>
    </SocketProvider>
  )
}
