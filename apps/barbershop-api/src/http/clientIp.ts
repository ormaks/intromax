import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

/**
 * The client's IP, used as the rate-limit key.
 *
 * Browsers reach the API through the frontend's /api proxy, so the socket
 * address is the proxy's, shared by every guest. The proxy passes the real
 * address in X-Forwarded-For, but any client can send that header too, so it
 * is believed only alongside the proxy's shared secret (X-Proxy-Secret). An
 * IP allow-list wouldn't do: the proxy runs on Cloudflare's shared address
 * ranges, which any other Worker can also send from.
 */
export function clientIp(request: FastifyRequest, proxySecret?: string) {
  if (proxySecret && sentBy(request, proxySecret)) {
    const forwarded = request.headers["x-forwarded-for"];
    const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    // The first address is the original client; later ones are proxies.
    const first = header?.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.ip;
}

function sentBy(request: FastifyRequest, secret: string) {
  const sent = request.headers["x-proxy-secret"];
  if (typeof sent !== "string") return false;
  // Hashing both sides gives equal lengths, which timingSafeEqual needs, and
  // the comparison takes the same time however much of the secret matches.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(sent), digest(secret));
}
