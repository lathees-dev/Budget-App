import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromToken } from "@/lib/api-auth";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    const category = await db.collection("categories").findOne({
      _id: new ObjectId(id),
    });

    if (!category || category.userId !== user.id) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    await db.collection("categories").deleteOne({ _id: new ObjectId(id) });

    await db.collection("transactions").deleteMany({
      userId: user.id,
      categoryId: id,
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