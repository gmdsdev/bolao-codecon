import { headers } from "next/headers";

import { getRequestOrigin } from "@/lib/request-origin";

export async function getServerSession() {
  const requestHeaders = await headers();

  try {
    const response = await fetch(
      `${getRequestOrigin(requestHeaders)}/api/auth/get-session`,
      {
        headers: {
          cookie: requestHeaders.get("cookie") ?? "",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Failed to resolve server session", response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to resolve server session", error);
    return null;
  }
}
