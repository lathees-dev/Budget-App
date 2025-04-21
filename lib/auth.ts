import { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose"; // Use jose instead of jsonwebtoken
import { cookies } from "next/headers";
import { UserData } from "./models/User";

// Secret should be stored in environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);
const JWT_EXPIRY = "7d"; // Token expiry: 7 days

// Generate JWT token
export async function generateToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(
  token: string
): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

// Set token in cookies
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "strict",
  });
}

// Remove token from cookies
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

// Get current user from token - this will now be used in a server component or API route
// NOT in edge middleware
export async function getCurrentUser(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    // This part will need to be moved to a non-edge function
    // as MongoDB client isn't edge compatible
    // For middleware, we'll only verify the token's validity

    return null; // We'll implement the actual user fetching in API routes
  } catch {
    return null;
  }
}

// Authentication check for Edge middleware
export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return false;
  }

  const decoded = await verifyToken(token);
  return !!decoded;
}
