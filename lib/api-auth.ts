import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";
import { verifyToken } from "./auth";
import { cookies } from "next/headers";

// This function is for server components and API routes, NOT edge middleware
export async function getUserFromToken() {
  try {
    const token = cookies().get("auth_token")?.value;

    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    const client = await clientPromise;
    const db = client.db("budget-app");

    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.sub),
    });

    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}

// Authentication middleware for API routes
export async function authMiddleware(req) {
  try {
    const token = cookies().get("auth_token")?.value;

    if (!token) {
      return { error: "Not authenticated", status: 401 };
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return { error: "Invalid token", status: 401 };
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.sub),
    });

    if (!user) {
      return { error: "User not found", status: 401 };
    }

    return {
      userId: user._id.toString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return { error: "Authentication error", status: 500 };
  }
}
