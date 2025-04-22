import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromToken } from "@/lib/api-auth";

export async function DELETE(request: NextRequest) {
  try {
    // Get the current user
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    // Find the transaction first to check ownership
    let transaction;
    try {
      transaction = await db.collection("transactions").findOne({
        _id: new ObjectId(id),
      });
    } catch {
      transaction = await db.collection("transactions").findOne({
        _id: id,
      });
    }

    // If transaction doesn't exist or doesn't belong to user
    if (!transaction || transaction.userId !== user.id) {
      return NextResponse.json(
        { error: "Transaction not found or access denied" },
        { status: 404 }
      );
    }

    await db.collection("transactions").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}