type SupabaseJwtPayload = {
  aud?: string | string[];
  exp?: number;
  iat?: number;
  iss?: string;
  role?: string;
  sub?: string;
};

const AUTHENTICATED_AUDIENCE = "authenticated";
const MINIMUM_JWT_SECRET_LENGTH = 32;
const SUPABASE_AUTH_PATH = "/auth/v1";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getRequiredJwtSecret() {
  const jwtSecret =
    process.env.JWT_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim() ||
    process.env.JWT_se_ret?.trim();

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is required for Convex document authentication."
    );
  }

  if (jwtSecret.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MINIMUM_JWT_SECRET_LENGTH} characters long.`
    );
  }

  return jwtSecret;
}

function getSupabaseJwtIssuer() {
  const explicitIssuer = process.env.SUPABASE_JWT_ISSUER?.trim();
  if (explicitIssuer) {
    return explicitIssuer;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_JWT_ISSUER or SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL is required for Convex document authentication."
    );
  }

  return `${trimTrailingSlash(supabaseUrl)}${SUPABASE_AUTH_PATH}`;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padding)}`;
  const decoded = atob(padded);

  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function decodeJwtPart<T>(value: string) {
  const bytes = decodeBase64Url(value);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

function hasExpectedAudience(aud: SupabaseJwtPayload["aud"]) {
  if (Array.isArray(aud)) {
    return aud.includes(AUTHENTICATED_AUDIENCE);
  }

  return aud === AUTHENTICATED_AUDIENCE;
}

let signingKeyPromise: Promise<CryptoKey> | null = null;

async function getSigningKey() {
  if (!signingKeyPromise) {
    signingKeyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getRequiredJwtSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
  }

  return signingKeyPromise;
}

async function verifySupabaseAccessToken(token: string) {
  const [headerPart, payloadPart, signaturePart] = token.split(".");

  if (!headerPart || !payloadPart || !signaturePart) {
    return null;
  }

  const header = decodeJwtPart<{ alg?: string; typ?: string }>(headerPart);
  if (header.alg !== "HS256") {
    return null;
  }

  const isSignatureValid = await crypto.subtle.verify(
    "HMAC",
    await getSigningKey(),
    decodeBase64Url(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  );

  if (!isSignatureValid) {
    return null;
  }

  const payload = decodeJwtPart<SupabaseJwtPayload>(payloadPart);

  if (payload.iss !== getSupabaseJwtIssuer()) {
    return null;
  }

  if (!hasExpectedAudience(payload.aud)) {
    return null;
  }

  if (payload.role && payload.role !== AUTHENTICATED_AUDIENCE) {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    return null;
  }

  if (!payload.sub) {
    return null;
  }

  return payload;
}

export async function requireAuthenticatedUserId(accessToken: string) {
  const payload = await verifySupabaseAccessToken(accessToken);

  if (!payload?.sub) {
    throw new Error("未认证");
  }

  return payload.sub;
}
