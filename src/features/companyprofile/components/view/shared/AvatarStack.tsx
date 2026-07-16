"use client";

import React from "react";
import Image from "next/image";

interface AvatarStackPerson {
  id: string;
  name: string;
  avatar: string;
}

interface AvatarStackProps {
  people: AvatarStackPerson[];
  /** Total count this stack represents, used for the "+X" overflow bubble. May exceed people.length. */
  totalCount: number;
  max?: number;
  size?: number;
}

export default function AvatarStack({ people, totalCount, max = 2, size = 32 }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = Math.max(totalCount - shown.length, 0);

  return (
    <div className="flex items-center" style={{ paddingLeft: overflow > 0 || shown.length > 1 ? size / 4 : 0 }}>
      {shown.map((person, idx) => (
        <div
          key={person.id}
          className="relative rounded-full overflow-hidden border-2 border-white dark:border-zinc-950"
          style={{
            width: size,
            height: size,
            marginLeft: idx === 0 ? -(size / 4) : -(size / 3),
            zIndex: shown.length - idx,
          }}
        >
          <Image src={person.avatar} alt={person.name} fill className="object-cover" unoptimized />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="relative rounded-full overflow-hidden border-2 border-white dark:border-zinc-950 bg-[#EFF4FF] dark:bg-zinc-800 flex items-center justify-center flex-shrink-0"
          style={{
            width: size,
            height: size,
            marginLeft: -(size / 3),
            zIndex: 0,
          }}
        >
          <span
            className="text-[#1A73E8] dark:text-blue-300 font-poppins font-medium"
            style={{ fontSize: size * 0.32 }}
          >
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}
