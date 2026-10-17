import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function MobileUnsupported() {
  return (
    <main className="min-h-[100dvh] w-full bg-ds-bg flex flex-col items-center px-4 relative">

      {/* Top Logo */}
      <div className="flex items-center gap-2 mt-24 flex-none">
        <div className="relative w-[32px] h-[32px] flex items-center justify-center">
          <Image
            src="/assets/mobile-logo.png"
            alt="Cocpit Logo"
            fill
            className="object-contain"
          />
        </div>
        <span className="font-dmsans font-medium text-[24px] leading-[40px] text-ds-text-primary">
          Cocpit
        </span>
      </div>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center gap-4 text-center flex-1 w-full max-w-[361px]">
        <h1 className="font-dmsans font-semibold text-[20px] leading-[40px] text-ds-text-primary">
          Want to use Cocpit on the web?
        </h1>
        <p className="font-dmsans text-[14px] leading-[20px] font-normal text-ds-text-secondary">
          Our web app is designed for desktop and larger screens. To use Cocpit on the web, open it from your computer.
        </p>
      </div>

      {/* Bottom Link */}
      <div className="flex-none pb-12">
        <Link
          href="https://cocpit.in/"
          className="flex items-center gap-2 text-ds-text-primary hover:opacity-80 transition-opacity"
        >
          <span className="font-dmsans text-[12px] leading-[16px] font-normal">
            Learn more about Cocpit
          </span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </main>
  )
}
