import { signOut, getSession } from "next-auth/react";

export const logout = async () => {
  try {
    const session = await getSession();
    if (session?.user?.accessToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session.user.accessToken}`
            }
        });
    }
  } catch (error) {
    console.error("Logout error", error);
  } finally {
    await signOut({ callbackUrl: "/" });
  }
};