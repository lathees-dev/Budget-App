import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromToken } from "@/lib/api-auth";

export async function PUT(request: NextRequest) {
  try {
    // Get the current user
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    const data = await request.json();
    const { id, categoryId, amount, date, description } = data;

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    // Input validation
    if (!categoryId || !amount || Number(amount) <= 0 || !date) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 }
      );
    }

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

    // Verify the category belongs to this user
    let category;
    try {
      category = await db.collection("categories").findOne({
        _id: new ObjectId(categoryId),
        userId: user.id,
      });
    } catch {
      category = await db.collection("categories").findOne({
        _id: categoryId,
        userId: user.id,
      });
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    await db.collection("transactions").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          categoryId,
          amount: Number(amount),
          date,
          description,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      id,
      categoryId,
      amount: Number(amount),
      date,
      description,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}