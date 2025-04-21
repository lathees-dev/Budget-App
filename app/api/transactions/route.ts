import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromToken } from "@/lib/api-auth";

// GET all transactions for current user
export async function GET() {
  try {
    // Get the current user
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("budget-app");

    // Only fetch transactions for this user
    const transactions = await db
      .collection("transactions")
      .find({ userId: user.id })
      .toArray();

    // Convert MongoDB _id to string id for frontend compatibility
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction._id.toString(),
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST new transaction for current user
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
    const { categoryId, amount, date, description } = data;

    console.log("Transaction data received:", {
      categoryId,
      amount,
      date,
      description,
    });

    // Input validation
    if (!categoryId || !amount || amount <= 0 || !date) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 }
      );
    }

    // Verify the category belongs to this user - check both with and without ObjectId conversion
    let category;
    try {
      // First try with ObjectId conversion
      category = await db.collection("categories").findOne({
        _id: new ObjectId(categoryId),
        userId: user.id,
      });
    } catch{
      // If ObjectId conversion fails, try with string ID
      category = await db.collection("categories").findOne({
        _id: categoryId,
        userId: user.id,
      });
    }

    if (!category) {
      console.error("Category not found for ID:", categoryId, "User:", user.id);
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    // Include userId when saving the transaction
    const result = await db.collection("transactions").insertOne({
      userId: user.id,
      categoryId, // Keep as string to match what frontend is sending
      amount: Number(amount), // Ensure amount is a number
      date,
      description,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        categoryId,
        amount: Number(amount),
        date,
        description,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
