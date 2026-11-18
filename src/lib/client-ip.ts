/**
 * The caller's IP for rate limiting, from headers a client cannot forge.
 *
 * The first X-Forwarded-For entry is whatever the client typed, so it is never
 * used. The right-most entry is the hop that connected to our edge (Railway
 * appends it). When that hop is a Cloudflare edge, Cloudflare's own
 * cf-connecting-ip is the real client; otherwise cf-connecting-ip is ignored,
 * because anyone hitting the Railway origin directly could set it.
 */
const CF_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
];
const CF_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];

function v4ToInt(ip: string): number | null {
  const p = ip.split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const x of p) {
    if (!/^\d{1,3}$/.test(x) || Number(x) > 255) return null;
    n = n * 256 + Number(x);
  }
  return n;
}

function v6ToBigInt(ip: string): bigint | null {
  if (!/^[0-9a-f:]+$/i.test(ip)) return null;
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : fill < 1) return null;
  const parts = [...head, ...Array(halves.length === 2 ? fill : 0).fill("0"), ...tail];
  let n = BigInt(0);
  for (const x of parts) {
    if (!/^[0-9a-f]{1,4}$/i.test(x)) return null;
    n = (n << BigInt(16)) + BigInt(parseInt(x, 16));
  }
  return n;
}

function inCidrs(ip: string, v4: string[], v6: string[]): boolean {
  if (ip.includes(".")) {
    const n = v4ToInt(ip.replace(/^::ffff:/i, ""));
    if (n === null) return false;
    return v4.some((c) => {
      const [base, bits] = c.split("/");
      const b = v4ToInt(base)!;
      const size = 2 ** (32 - Number(bits));
      return Math.floor(n / size) === Math.floor(b / size);
    });
  }
  const n = v6ToBigInt(ip);
  if (n === null) return false;
  return v6.some((c) => {
    const [base, bits] = c.split("/");
    const shift = BigInt(128 - Number(bits));
    return n >> shift === v6ToBigInt(base)! >> shift;
  });
}

export function isCloudflare(ip: string): boolean {
  return inCidrs(ip, CF_V4, CF_V6);
}

export function clientIp(req: Request): string {
  const xff = (req.headers.get("x-forwarded-for") ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const peer = xff[xff.length - 1] || req.headers.get("x-real-ip")?.trim() || "";
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf && peer && isCloudflare(peer)) return cf;
  return peer || "unknown";
}
