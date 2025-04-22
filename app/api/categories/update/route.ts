import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromToken } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    const data = await request.json();
    const { id, name, budget, color } = data;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const category = await db.collection("categories").findOne({
      _id: new ObjectId(id),
    });

    if (!category || category.userId !== user.id) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, budget, color, updatedAt: new Date() } }
    );

    return NextResponse.json({ id, name, budget, color });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}