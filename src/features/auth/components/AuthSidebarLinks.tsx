"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

interface AuthSidebarLinksProps {
  isMobile?: boolean;
}

export default function AuthSidebarLinks({ isMobile = false }: AuthSidebarLinksProps) {
  if (isMobile) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-['DM_Sans']">
        <Link href="https://cocpit.in/about" target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
          <span className="!text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline transition-colors">
            About
          </span>
        </Link>
        <Link href="https://cocpit.in/careers" target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
          <span className="!text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline transition-colors">
            Careers
          </span>
        </Link>
        <Link href="https://cocpit.in/contact" target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
          <span className="!text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline transition-colors">
            Contact
          </span>
        </Link>
        <Link href="https://cocpit.in/community-guidelines" target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
          <span className="!text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline transition-colors">
            User
          </span>
        </Link>
        <Link href="https://cocpit.in/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
          <span className="!text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline transition-colors">
            Terms &amp; conditions
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col justify-start items-start gap-3 font-['DM_Sans']" aria-label="Quick links">
      {/* Info Section */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-between items-center">
          <div className="text-center justify-start text-ds-text-muted text-[10px] font-medium font-['DM_Sans']">Info</div>
        </div>
        <Link href="https://cocpit.in/about" target="_blank" rel="noopener noreferrer" className="h-9 inline-flex justify-start items-center gap-2 group cursor-pointer">
          <div className="size-5 relative overflow-hidden flex items-center justify-center">
            <Icon name="info" className="size-5 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors" />
          </div>
          <div className="flex justify-center items-center gap-2.5">
            <div className="justify-start !text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline text-base font-medium font-['DM_Sans'] transition-colors">
              About
            </div>
          </div>
        </Link>
      </div>

      {/* Support Section */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-between items-center">
          <div className="text-center justify-start text-ds-text-muted text-[10px] font-medium font-['DM_Sans']">Support</div>
        </div>
        <Link href="https://cocpit.in/careers" target="_blank" rel="noopener noreferrer" className="h-9 inline-flex justify-start items-center gap-2 group cursor-pointer">
          <div className="size-5 relative overflow-hidden flex items-center justify-center">
            <Icon name="careers" className="size-5 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors" />
          </div>
          <div className="flex justify-center items-center gap-2.5">
            <div className="justify-start !text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline text-base font-medium font-['DM_Sans'] transition-colors">
              Careers
            </div>
          </div>
        </Link>
        <Link href="https://cocpit.in/contact" target="_blank" rel="noopener noreferrer" className="h-9 inline-flex justify-start items-center gap-2 group cursor-pointer">
          <div className="size-5 relative overflow-hidden flex items-center justify-center">
            <Icon name="contact" className="size-5 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors" />
          </div>
          <div className="flex justify-center items-center gap-2.5">
            <div className="justify-start !text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline text-base font-medium font-['DM_Sans'] transition-colors">
              Contact
            </div>
          </div>
        </Link>
      </div>

      {/* Agreement Section */}
      <div className="flex flex-col justify-start items-start gap-2">
        <div className="self-stretch inline-flex justify-between items-center">
          <div className="text-center justify-start text-ds-text-muted text-[10px] font-medium font-['DM_Sans']">Agreement</div>
        </div>
        <Link href="https://cocpit.in/community-guidelines" target="_blank" rel="noopener noreferrer" className="h-9 inline-flex justify-start items-center gap-2 group cursor-pointer">
          <div className="size-5 relative overflow-hidden flex items-center justify-center">
            <Icon name="user" className="size-5 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors" />
          </div>
          <div className="justify-start !text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline text-base font-medium font-['DM_Sans'] transition-colors">
            User
          </div>
        </Link>
        <Link href="https://cocpit.in/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="self-stretch h-9 inline-flex justify-start items-center gap-2 group cursor-pointer">
          <div className="size-5 relative overflow-hidden flex items-center justify-center">
            <Icon name="terms" className="size-5 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors" />
          </div>
          <div className="justify-start !text-ds-text-secondary group-hover:!text-ds-text-primary group-hover:underline text-base font-medium font-['DM_Sans'] transition-colors">
            Terms &amp; conditions
          </div>
        </Link>
      </div>
    </div>
  );
}
