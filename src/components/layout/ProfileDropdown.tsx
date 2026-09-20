"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Icon } from "@/components/icons";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";

interface ProfileDropdownProps {
  className?: string;
}

export function ProfileDropdown({ className }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  const { activeProfile } = useActiveProfile();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const profileHref =
    activeProfile?.type === "COMPANY" && activeProfile.slug
      ? `/organization/${activeProfile.slug}`
      : "/profile";

  const avatarUrl =
    (activeProfile as any)?.avatar_url || user?.image || undefined;
  const displayName =
    (activeProfile as any)?.name || user?.name || "User";

  const handleProfileClick = () => {
    setOpen(false);
    router.push(profileHref);
  };

  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutConfirm(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={`relative flex items-center ${className || ""}`} ref={dropdownRef}>
      {/* Trigger: Frame 2609490 (24x24px, rounded-[100px], flex-none, order-1, grow-0) */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-[24px] h-[24px] rounded-[100px] overflow-hidden flex-none order-1 grow-0 hover:opacity-80 transition-opacity flex items-center justify-center bg-ds-surface-1 text-ds-text-primary cursor-pointer border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <Icon name="user" className="w-full h-full p-1 text-ds-text-primary" />
        )}
      </button>

      {/* Dropdown Box: exact Figma specification */}
      {open && (
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "12px",
            gap: "16px",
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "115px",
            background: "#030303",
            border: "1px solid #2C2C33",
            borderRadius: "16px 0px 16px 16px",
            zIndex: 100,
          }}
        >
          {/* Frame 2609474 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0px",
              gap: "12px",
              width: "89px",
              height: "48px",
              flex: "none",
              order: 0,
              flexGrow: 0,
            }}
          >
            {/* Frame 2609461 */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0px",
                gap: "10px",
                width: "89px",
                height: "16px",
                flex: "none",
                order: 0,
                alignSelf: "stretch",
                flexGrow: 0,
              }}
            >
              <span
                style={{
                  width: "48px",
                  height: "16px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "16px",
                  textAlign: "center",
                  color: "#B8ADA8",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                Personal
              </span>
            </div>

            {/* Side bar label / User row */}
            <button
              type="button"
              onClick={handleProfileClick}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px",
                gap: "8px",
                width: "89px",
                height: "20px",
                borderRadius: "100px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                flex: "none",
                order: 1,
                alignSelf: "stretch",
                flexGrow: 0,
                textAlign: "left",
              }}
              className="hover:opacity-80 transition-opacity focus-visible:outline-none"
            >
              {/* User Avatar: Background+Border+Shadow */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "0px",
                  gap: "8px",
                  width: "20px",
                  height: "20px",
                  boxShadow:
                    "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  borderRadius: "100px",
                  overflow: "hidden",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                  backgroundColor: "#1A1A20",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#B8ADA8",
                      fontWeight: 500,
                    }}
                  >
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <span
                style={{
                  width: "61px",
                  height: "20px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  textAlign: "left",
                  color: "#FFECE6",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: "none",
                  order: 1,
                  flexGrow: 0,
                }}
              >
                {displayName}
              </span>
            </button>
          </div>

          {/* Frame 2609845 / Log out */}
          <button
            type="button"
            onClick={handleLogoutClick}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0px",
              gap: "8px",
              width: "77px",
              height: "20px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              flex: "none",
              order: 1,
              flexGrow: 0,
            }}
            className="hover:opacity-80 transition-opacity focus-visible:outline-none"
          >
            {/* ph:sign-out */}
            <div
              style={{
                width: "20px",
                height: "20px",
                flex: "none",
                order: 0,
                flexGrow: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.375 16.875C9.375 17.0408 9.30915 17.1997 9.19194 17.3169C9.07473 17.4342 8.91576 17.5 8.75 17.5H3.75C3.58424 17.5 3.42527 17.4342 3.30806 17.3169C3.19085 17.1997 3.125 17.0408 3.125 16.875V3.125C3.125 2.95924 3.19085 2.80027 3.30806 2.68306C3.42527 2.56585 3.58424 2.5 3.75 2.5H8.75C8.91576 2.5 9.07473 2.56585 9.19194 2.68306C9.30915 2.80027 9.375 2.95924 9.375 3.125C9.375 3.29076 9.30915 3.44973 9.19194 3.56694C9.07473 3.68415 8.91576 3.75 8.75 3.75H4.375V16.25H8.75C8.91576 16.25 9.07473 16.3158 9.19194 16.4331C9.30915 16.5503 9.375 16.7092 9.375 16.875ZM17.9422 9.55781L14.8172 6.43281C14.6999 6.31554 14.5409 6.24965 14.375 6.24965C14.2091 6.24965 14.0501 6.31554 13.9328 6.43281C13.8155 6.55009 13.7497 6.70915 13.7497 6.875C13.7497 7.04085 13.8155 7.19991 13.9328 7.31719L15.9914 9.375H8.75C8.58424 9.375 8.42527 9.44085 8.30806 9.55806C8.19085 9.67527 8.125 9.83424 8.125 10C8.125 10.1658 8.19085 10.3247 8.30806 10.4419C8.42527 10.5592 8.58424 10.625 8.75 10.625H15.9914L13.9328 12.6828C13.8155 12.8001 13.7497 12.9591 13.7497 13.125C13.7497 13.2909 13.8155 13.4499 13.9328 13.5672C14.0501 13.6845 14.2091 13.7503 14.375 13.7503C14.5409 13.7503 14.6999 13.6845 14.8172 13.5672L17.9422 10.4422C18.0003 10.3841 18.0464 10.3152 18.0779 10.2393C18.1093 10.1635 18.1255 10.0821 18.1255 10C18.1255 9.91787 18.1093 9.83654 18.0779 9.76066C18.0464 9.68479 18.0003 9.61586 17.9422 9.55781Z"
                  fill="#E5484D"
                />
              </svg>
            </div>

            {/* Log out text */}
            <span
              style={{
                width: "49px",
                height: "20px",
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: "normal",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                textAlign: "left",
                color: "#E5484D",
                flex: "none",
                order: 1,
                flexGrow: 0,
              }}
            >
              Log out
            </span>
          </button>
        </div>
      )}

      {/* Confirmation modal on logout click */}
      <ActionConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        type="logout"
        isLoading={isLoggingOut}
      />
    </div>
  );
}

export default ProfileDropdown;
