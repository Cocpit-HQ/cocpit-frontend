import { signOut, getSession } from "next-auth/react";

let isLoggingOut = false;

// Create a broadcast channel for cross-tab logout synchronization
const authChannel = typeof window !== "undefined" ? new BroadcastChannel("auth_channel") : null;

/**
 * Robust hard logout that clears all auth state and synchronizes across tabs.
 * @param reason Optional reason for logout (e.g., 'session_ended')
 * @param isInternal If true, this call was triggered by a broadcast from another tab
 */
export const hardLogout = async (reason?: string, isInternal: boolean = false) => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  console.log(`[Logout] Hard logout triggered. Reason: ${reason || "manual"}, Internal: ${isInternal}`);

  try {
    // 1. Notify other tabs via BroadcastChannel if this originates from user action/interceptor
    if (authChannel && !isInternal) {
      authChannel.postMessage({ type: "LOGOUT", reason });
    }

    // 2. Notify backend of termination if we still have an access token
    const session = await getSession();
    if (session?.user?.accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.user.accessToken}`
        }
      }).catch(err => console.debug("Silent logout notification failed", err));
    }
  } catch (error) {
    console.debug("Session fetch error during logout", error);
  } finally {
    // 3. Clear all local storage auth-related artifacts
    if (typeof window !== "undefined") {
      localStorage.removeItem("nextauth.message");
      // Add any other custom cache keys here (Query cache, etc. are cleared by full page reload normally)
    }

    // 4. Trigger NextAuth signOut
    // This will clear the session and redirect the user
    await signOut({
      redirect: true,
      callbackUrl: reason ? `/?reason=${reason}` : "/"
    });

    isLoggingOut = false;
  }
};

// Listen for logout signals from other tabs
if (authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data?.type === "LOGOUT") {
      hardLogout(event.data.reason, true);
    }
  };
}

// Keeping the 'logout' alias for backward compatibility
export const logout = hardLogout;