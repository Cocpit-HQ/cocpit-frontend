import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
}

// Since Next.js Link doesn't natively support "active" styling props in the same way RR NavLink does
// (it usually requires checking usePathname), we are simplifying this component for now.
// Ideally, the parent component should handle the active state logic.
export const NavLink = ({
  href,
  className,
  activeClassName,
  children,
  ...props
}: NavLinkProps) => {
  return (
    <Link
      href={href}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
};
