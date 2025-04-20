import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromToken } from "@/lib/api-auth";

// GET all categories for current user
export async function GET() {
  try {
    // Get the current user
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    // Only fetch categories for this user
    const categories = await db
      .collection("categories")
      .find({ userId: user.id })
      .toArray();

    // Convert MongoDB _id to string id for frontend compatibility
    const formattedCategories = categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      budget: category.budget,
      color: category.color,
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST new category for current user
export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    const data = await request.json();
    const { name, budget, color } = data;

    // Include userId when saving the category
    const result = await db.collection("categories").insertOne({
      userId: user.id, // Associate with current user
      name,
      budget,
      color,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        name,
        budget,
        color,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
