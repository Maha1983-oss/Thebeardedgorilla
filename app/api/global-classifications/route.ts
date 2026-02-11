import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { globalClient2Classifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET - Fetch global classifications (admin and client2 can read)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin and client2 to access
    if (session.role !== "admin" && session.role !== "client2") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the latest active global classifications
    const [latest] = await db
      .select()
      .from(globalClient2Classifications)
      .where(eq(globalClient2Classifications.isActive, true))
      .orderBy(desc(globalClient2Classifications.createdAt))
      .limit(1);

    return NextResponse.json({
      classifications: latest?.classifications || {},
      hasClassifications: !!latest,
    });
  } catch (error) {
    console.error("Error fetching global classifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch classifications" },
      { status: 500 }
    );
  }
}

// POST - Create/update global classifications (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manage global classifications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { classifications } = body;

    if (!classifications || typeof classifications !== "object") {
      return NextResponse.json(
        { error: "Invalid classifications data" },
        { status: 400 }
      );
    }

    // Deactivate all existing global classifications
    await db
      .update(globalClient2Classifications)
      .set({ isActive: false })
      .where(eq(globalClient2Classifications.isActive, true));

    // Create new global classifications
    const [newClassification] = await db
      .insert(globalClient2Classifications)
      .values({
        classifications,
        createdBy: session.id,
      })
      .returning();

    return NextResponse.json({
      message: "Global classifications updated successfully",
      id: newClassification.id,
    });
  } catch (error) {
    console.error("Error updating global classifications:", error);
    return NextResponse.json(
      { error: "Failed to update classifications" },
      { status: 500 }
    );
  }
}
