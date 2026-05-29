"use client";

import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";

type FeedUpdate = {
  id: string;
  date: string;
  title: string;
  href: string;
  image: string;
};

const updates: FeedUpdate[] = [
  {
    id: "uiux-hiring",
    date: "08 May 2026",
    title: "UI/UX hiring +18% this month",
    href: "/jobs",
    image: "/images/updates/uiux hiring.svg",
  },
  {
    id: "freshers",
    date: "08 May 2026",
    title: "200+ fresher roles added",
    href: "/jobs",
    image: "/images/updates/200+fresher role.svg",
  },
  {
    id: "remote-design",
    date: "08 May 2026",
    title: "Remote design demand rising",
    href: "/showcase",
    image: "/images/updates/remotedesign demand.svg",
  },
  {
    id: "roles",
    date: "08 May 2026",
    title: "200+ fresher roles added",
    href: "/jobs",
    image: "/images/updates/200+roles added.svg",
  },
];

export default function UpdatesPanel() {
  return (
    <section className="hidden w-full flex-col gap-6 lg:flex">
      <div className="space-y-4">
        <h2 className="px-1 text-lg font-medium text-foreground">Updates</h2>

        {updates.map((update) => {
          return (
            <Link
              key={update.id}
              href={update.href}
              className="feed-card-shell outline outline-1 outline-offset-[-1px] outline-indigo-50 group flex w-[336px] h-[128px] gap-4 p-4 transition-shadow hover:shadow-md bg-white rounded-[24px]"
            >
              <div className="relative w-[144px] h-[95px] shrink-0 overflow-hidden rounded-[24px] bg-muted">
                <Image
                  src={update.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="190px"
                />
              </div>
              <div className="flex flex-col w-[144px] h-[96px] gap-2 text-left">
                <span className="text-[12px] font-normal leading-[16px] text-[#6B7280] font-['Poppins']">{update.date}</span>
                <p className="line-clamp-2 text-[16px] font-medium leading-[24px] text-[#000000] font-['Poppins']">{update.title}</p>
                <span className="text-[12px] font-normal leading-[16px] text-[#6B7280] font-['Poppins']">Read</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="feed-card-shell outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col items-center w-[336px] h-[172px] p-4 gap-4 bg-white rounded-[24px]">
        <div className="flex flex-row items-center w-[304px] h-[68px] gap-4 p-0">
          <div className="relative w-[68px] h-[68px] shrink-0 overflow-hidden">
            <Image
              src="/images/updates/update to pro.svg"
              alt="Update to PRO"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col justify-center items-start w-[220px] h-[68px] gap-2 p-0">
            <h3 className="w-[220px] h-5 text-black text-[14px] font-normal leading-[20px] font-['Poppins']">Update to PRO</h3>
            <p className="w-[220px] h-10 text-[#6B7280] text-[14px] font-normal leading-[20px] font-['Poppins']">
              Get noticed faster by recruiters and unlock smarter AI tools
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="flex flex-row justify-center items-center w-[304px] h-[56px] p-4 gap-2.5 bg-white border border-[#6366F1] rounded-[24px]"
        >
          <span className="text-center text-[#6366F1] text-[16px] font-medium font-['Poppins'] leading-[24px]">Update now</span>
        </Link>
      </div>
    </section>
  );
}
