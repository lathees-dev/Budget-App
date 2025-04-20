import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromToken } from "@/lib/api-auth";

// PUT (update) a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find the category first to check ownership
    const category = await db.collection("categories").findOne({
      _id: new ObjectId(params.id),
    });

    // If category doesn't exist or doesn't belong to user
    if (!category || category.userId !== user.id) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    await db
      .collection("categories")
      .updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { name, budget, color, updatedAt: new Date() } }
      );

    return NextResponse.json({ id: params.id, name, budget, color });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE a category
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    // Find the category first to check ownership
    const category = await db.collection("categories").findOne({
      _id: new ObjectId(params.id),
    });

    // If category doesn't exist or doesn't belong to user
    if (!category || category.userId !== user.id) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    await db
      .collection("categories")
      .deleteOne({ _id: new ObjectId(params.id) });

    // Delete all related transactions as well
    await db.collection("transactions").deleteMany({
      userId: user.id,
      categoryId: params.id,
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
