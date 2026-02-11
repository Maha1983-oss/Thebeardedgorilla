import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cashflowTransactions, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, inArray, or } from "drizzle-orm";

// GET - Fetch all cashflow transactions
// - Admin sees all transactions
// - Client2 users see shared pool (all client2 + admin transactions)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let transactions;

    if (session.role === "admin") {
      // Admin sees all transactions
      transactions = await db
        .select()
        .from(cashflowTransactions)
        .orderBy(desc(cashflowTransactions.date));
    } else if (session.role === "client2") {
      // Client2 users see shared pool: all client2 + admin transactions
      // Get all client2 and admin user IDs
      const sharedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.role, "client2"), eq(users.role, "admin")));

      const sharedUserIds = sharedUsers.map((u) => u.id);

      if (sharedUserIds.length > 0) {
        transactions = await db
          .select()
          .from(cashflowTransactions)
          .where(inArray(cashflowTransactions.userId, sharedUserIds))
          .orderBy(desc(cashflowTransactions.date));
      } else {
        transactions = [];
      }
    } else {
      // Other roles only see their own data
      transactions = await db
        .select()
        .from(cashflowTransactions)
        .where(eq(cashflowTransactions.userId, session.id))
        .orderBy(desc(cashflowTransactions.date));
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching cashflow transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST - Create a new cashflow transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, description, category, type, amount } = body;

    if (!date || !description || !category || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [transaction] = await db
      .insert(cashflowTransactions)
      .values({
        userId: session.id,
        date,
        description,
        category,
        type,
        amount,
      })
      .returning();

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error creating cashflow transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// PUT - Update a cashflow transaction
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, date, description, category, type, amount } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // For client2 users, allow editing items from shared pool (client2 + admin)
    let whereCondition;
    if (session.role === "client2") {
      const sharedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.role, "client2"), eq(users.role, "admin")));
      const sharedUserIds = sharedUsers.map((u) => u.id);
      whereCondition = and(
        eq(cashflowTransactions.id, id),
        inArray(cashflowTransactions.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(cashflowTransactions.id, id),
        eq(cashflowTransactions.userId, session.id)
      );
    }

    const [transaction] = await db
      .update(cashflowTransactions)
      .set({
        date,
        description,
        category,
        type,
        amount,
        updatedAt: new Date(),
      })
      .where(whereCondition)
      .returning();

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error updating cashflow transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a cashflow transaction
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // For client2 users, allow deleting items from shared pool (client2 + admin)
    let whereCondition;
    if (session.role === "client2") {
      const sharedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.role, "client2"), eq(users.role, "admin")));
      const sharedUserIds = sharedUsers.map((u) => u.id);
      whereCondition = and(
        eq(cashflowTransactions.id, id),
        inArray(cashflowTransactions.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(cashflowTransactions.id, id),
        eq(cashflowTransactions.userId, session.id)
      );
    }

    await db.delete(cashflowTransactions).where(whereCondition);

    return NextResponse.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting cashflow transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
