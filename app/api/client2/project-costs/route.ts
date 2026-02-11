import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectCosts, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, inArray, or } from "drizzle-orm";

// GET - Fetch all project costs
// - Admin sees all project costs
// - Client2 users see shared pool (all client2 + admin project costs)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let costs;

    if (session.role === "admin") {
      // Admin sees all project costs
      costs = await db
        .select()
        .from(projectCosts)
        .orderBy(desc(projectCosts.monthYear));
    } else if (session.role === "client2") {
      // Client2 users see shared pool: all client2 + admin project costs
      // Get all client2 and admin user IDs
      const sharedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.role, "client2"), eq(users.role, "admin")));

      const sharedUserIds = sharedUsers.map((u) => u.id);

      if (sharedUserIds.length > 0) {
        costs = await db
          .select()
          .from(projectCosts)
          .where(inArray(projectCosts.userId, sharedUserIds))
          .orderBy(desc(projectCosts.monthYear));
      } else {
        costs = [];
      }
    } else {
      // Other roles only see their own data
      costs = await db
        .select()
        .from(projectCosts)
        .where(eq(projectCosts.userId, session.id))
        .orderBy(desc(projectCosts.monthYear));
    }

    return NextResponse.json({ projectCosts: costs });
  } catch (error) {
    console.error("Error fetching project costs:", error);
    return NextResponse.json(
      { error: "Failed to fetch project costs" },
      { status: 500 }
    );
  }
}

// POST - Create a new project cost
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      monthYear,
      projectName,
      client,
      market,
      baseAmountUSD,
      dataUSD,
      totalAmountUSD,
      baseAmountSGD,
      dataSGD,
      totalAmountSGD,
      projectRevenue,
      costPercentage,
      status,
    } = body;

    if (!monthYear || !projectName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [cost] = await db
      .insert(projectCosts)
      .values({
        userId: session.id,
        monthYear,
        projectName,
        client,
        market,
        baseAmountUSD,
        dataUSD,
        totalAmountUSD,
        baseAmountSGD,
        dataSGD,
        totalAmountSGD,
        projectRevenue,
        costPercentage,
        status: status || "Pending",
      })
      .returning();

    return NextResponse.json({ projectCost: cost });
  } catch (error) {
    console.error("Error creating project cost:", error);
    return NextResponse.json(
      { error: "Failed to create project cost" },
      { status: 500 }
    );
  }
}

// PUT - Update a project cost
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Project cost ID is required" },
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
        eq(projectCosts.id, id),
        inArray(projectCosts.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(projectCosts.id, id),
        eq(projectCosts.userId, session.id)
      );
    }

    const [cost] = await db
      .update(projectCosts)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(whereCondition)
      .returning();

    if (!cost) {
      return NextResponse.json(
        { error: "Project cost not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ projectCost: cost });
  } catch (error) {
    console.error("Error updating project cost:", error);
    return NextResponse.json(
      { error: "Failed to update project cost" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project cost
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
        { error: "Project cost ID is required" },
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
        eq(projectCosts.id, id),
        inArray(projectCosts.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(projectCosts.id, id),
        eq(projectCosts.userId, session.id)
      );
    }

    await db.delete(projectCosts).where(whereCondition);

    return NextResponse.json({ message: "Project cost deleted successfully" });
  } catch (error) {
    console.error("Error deleting project cost:", error);
    return NextResponse.json(
      { error: "Failed to delete project cost" },
      { status: 500 }
    );
  }
}
