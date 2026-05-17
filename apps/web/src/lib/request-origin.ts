import "server-only";

export function getRequestOrigin(requestHeaders: Headers) {
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    throw new Error("Unable to resolve request host");
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}
