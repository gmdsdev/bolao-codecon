import { headers } from "next/headers";

import { authClient } from "@/lib/auth-client";

export async function getServerSession() {
  const requestHeaders = await headers();

  try {
    const session = await authClient.getSession({
      fetchOptions: {
        headers: requestHeaders,
      },
    });

    if (session.error) {
      console.error("Failed to resolve server session", session.error);
      return null;
    }

    return session.data;
  } catch (error) {
    console.error("Failed to resolve server session", error);
    return null;
  }
}
