import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc, inArray, or } from "drizzle-orm";

// GET - Fetch all projects
// - Admin sees all projects
// - Client2 users see shared pool (all client2 + admin projects)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userProjects;

    if (session.role === "admin") {
      // Admin sees all projects
      userProjects = await db.select().from(projects).orderBy(desc(projects.date));
    } else if (session.role === "client2") {
      // Client2 users see shared pool: all client2 + admin projects
      // Get all client2 and admin user IDs
      const sharedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.role, "client2"), eq(users.role, "admin")));

      const sharedUserIds = sharedUsers.map((u) => u.id);

      if (sharedUserIds.length > 0) {
        userProjects = await db
          .select()
          .from(projects)
          .where(inArray(projects.userId, sharedUserIds))
          .orderBy(desc(projects.date));
      } else {
        userProjects = [];
      }
    } else {
      // Other roles only see their own data
      userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, session.id))
        .orderBy(desc(projects.date));
    }

    return NextResponse.json({ projects: userProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      clientProject,
      projectNumber,
      valueQuoted,
      quotedCurrency,
      valueSGD,
      numberOfStudies,
      purchaseOrder,
      fieldWorkStatus,
      fieldWorkStartDate,
      fieldWorkEndDate,
      reportStatus,
      invoiceStatus,
      invoiceDate,
    } = body;

    if (!date || !clientProject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [project] = await db
      .insert(projects)
      .values({
        userId: session.id,
        date,
        clientProject,
        projectNumber,
        valueQuoted,
        quotedCurrency: quotedCurrency || "USD",
        valueSGD,
        numberOfStudies,
        purchaseOrder,
        fieldWorkStatus: fieldWorkStatus || "Not Started",
        fieldWorkStartDate,
        fieldWorkEndDate,
        reportStatus: reportStatus || "Not Started",
        invoiceStatus: invoiceStatus || "Not Issued",
        invoiceDate,
      })
      .returning();

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// PUT - Update a project
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
        { error: "Project ID is required" },
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
        eq(projects.id, id),
        inArray(projects.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(projects.id, id),
        eq(projects.userId, session.id)
      );
    }

    const [project] = await db
      .update(projects)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(whereCondition)
      .returning();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
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
        { error: "Project ID is required" },
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
        eq(projects.id, id),
        inArray(projects.userId, sharedUserIds)
      );
    } else {
      whereCondition = and(
        eq(projects.id, id),
        eq(projects.userId, session.id)
      );
    }

    await db.delete(projects).where(whereCondition);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
