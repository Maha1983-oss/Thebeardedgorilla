import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pipelineDeals, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, inArray, or } from "drizzle-orm";

// GET - Fetch all pipeline deals
// - Admin sees all deals
// - Client2 users see shared pool (all client2 + admin deals)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let deals;

    if (session.role === "admin") {
      // Admin sees all deals
      deals = await db
        .select()
        .from(pipelineDeals)
        .orderBy(desc(pipelineDeals.createdAt));
    } else if (session.role === "client2") {
      // Client2 users see shared pool: all client2 + admin deals
      // Get all client2 and admin user IDs
      const sharedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.role, "client2"), eq(users.role, "admin")));

      const sharedUserIds = sharedUsers.map((u) => u.id);

      if (sharedUserIds.length > 0) {
        deals = await db
          .select()
          .from(pipelineDeals)
          .where(inArray(pipelineDeals.userId, sharedUserIds))
          .orderBy(desc(pipelineDeals.createdAt));
      } else {
        deals = [];
      }
    } else {
      // Other roles only see their own data
      deals = await db
        .select()
        .from(pipelineDeals)
        .where(eq(pipelineDeals.userId, session.id))
        .orderBy(desc(pipelineDeals.createdAt));
    }

    return NextResponse.json({ deals });
  } catch (error) {
    console.error("Error fetching pipeline deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// POST - Create a new pipeline deal
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientName,
      dealName,
      dealValue,
      stage,
      probability,
      expectedCloseDate,
      revenueBreakdown,
    } = body;

    if (!clientName || !dealName || !dealValue || !stage || !probability) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [deal] = await db
      .insert(pipelineDeals)
      .values({
        userId: session.id,
        clientName,
        dealName,
        dealValue,
        stage,
        probability,
        expectedCloseDate: expectedCloseDate || null,
        revenueBreakdown: revenueBreakdown || [],
      })
      .returning();

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error creating pipeline deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}

// PUT - Update a pipeline deal
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      clientName,
      dealName,
      dealValue,
      stage,
      probability,
      expectedCloseDate,
      revenueBreakdown,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Deal ID is required" },
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
        eq(pipelineDeals.id, id),
        inArray(pipelineDeals.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(pipelineDeals.id, id),
        eq(pipelineDeals.userId, session.id)
      );
    }

    const [deal] = await db
      .update(pipelineDeals)
      .set({
        clientName,
        dealName,
        dealValue,
        stage,
        probability,
        expectedCloseDate,
        revenueBreakdown,
        updatedAt: new Date(),
      })
      .where(whereCondition)
      .returning();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error updating pipeline deal:", error);
    return NextResponse.json(
      { error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pipeline deal
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
        { error: "Deal ID is required" },
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
        eq(pipelineDeals.id, id),
        inArray(pipelineDeals.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(pipelineDeals.id, id),
        eq(pipelineDeals.userId, session.id)
      );
    }

    await db.delete(pipelineDeals).where(whereCondition);

    return NextResponse.json({ message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Error deleting pipeline deal:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
