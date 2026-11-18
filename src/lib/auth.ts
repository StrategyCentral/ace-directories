import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE = "ald_session";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

type Purpose = "magic" | "session";

/**
 * Magic-link tokens and session tokens are different kinds of token: a magic
 * link carries `purpose: "magic"` and a single-use `jti`, a session cookie
 * carries `purpose: "session"`. Neither is accepted in place of the other.
 */
export async function signToken(
  payload: { email: string },
  expiresIn = "15m",
  purpose: Purpose = "session",
): Promise<string> {
  const jwt = new SignJWT({ ...payload, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn);
  return jwt.sign(secret());
}

/** A new single-use magic-link token and its id (store the id; consume it once). */
export async function signMagicToken(email: string, expiresIn = "20m"): Promise<{ token: string; jti: string }> {
  const jti = randomUUID();
  const token = await new SignJWT({ email, purpose: "magic" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime(expiresIn)
    .sign(secret());
  return { token, jti };
}

/** Verifies a magic-link token. The caller must still consume `jti` exactly once. */
export async function verifyMagicToken(token: string): Promise<{ email: string; jti: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "magic" || typeof payload.email !== "string" || typeof payload.jti !== "string") {
      return null;
    }
    return { email: payload.email, jti: payload.jti };
  } catch {
    return null;
  }
}

/** Verifies a session token. Rejects magic-link tokens. */
export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.email !== "string") return null;
    if (payload.purpose === "session") return { email: payload.email };
    // Sessions issued before tokens carried a purpose: 30-day tokens. Old
    // magic links lived 20 minutes, so anything that short is not a session.
    if (payload.purpose === undefined && payload.iat && payload.exp && payload.exp - payload.iat > 3600) {
      return { email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSession(email: string) {
  const token = await signToken({ email }, "30d", "session");
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<{ email: string } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
