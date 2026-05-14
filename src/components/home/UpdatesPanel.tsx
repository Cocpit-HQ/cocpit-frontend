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
    image: "/assets/openingPage.jpg",
  },
  {
    id: "freshers",
    date: "08 May 2026",
    title: "200+ fresher roles added",
    href: "/jobs",
    image: "/assets/coverphoto.jpg",
  },
  {
    id: "remote-design",
    date: "08 May 2026",
    title: "Remote design demand rising",
    href: "/showcase",
    image: "/assets/company-placeholder.png",
  },
  {
    id: "roles",
    date: "08 May 2026",
    title: "200+ fresher roles added",
    href: "/jobs",
    image: "/assets/coverphoto.jpg",
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
              className="feed-card-shell group flex min-h-[128px] gap-3 p-4 transition-shadow hover:shadow-md"
            >
              <div className="relative h-[95px] w-[46%] shrink-0 overflow-hidden rounded-3xl bg-muted">
                <Image
                  src={update.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="190px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <span className="text-xs text-muted-foreground">{update.date}</span>
                <p className="line-clamp-2 text-base font-medium leading-6 text-foreground">{update.title}</p>
                <span className="text-xs text-muted-foreground">Read</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="feed-card-shell flex flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Gem className="h-9 w-9" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-foreground">Update to PRO</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Get noticed faster by recruiters and unlock smarter AI tools.
            </p>
        </div>
      </div>
        <Link
          href="/settings"
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-primary px-4 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Update now
        </Link>
      </div>
    </section>
  );
}
