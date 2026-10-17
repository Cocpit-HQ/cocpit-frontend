"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function MemoryRouter({ section }: { section: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    // Only fire if we are exactly at the base section path with NO explicit query params
    if (pathname === `/${section}` && searchParams.toString() === "") {
      const savedPath = sessionStorage.getItem(`nav_memory_${section}`);
      if (savedPath && savedPath !== `/${section}`) {
        // Redirect seamlessly without polluting browser history
        router.replace(savedPath);
      }
    }
  }, [pathname, section, router, searchParams]);

  return null;
}
