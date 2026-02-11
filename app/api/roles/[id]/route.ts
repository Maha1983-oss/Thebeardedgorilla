import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

// GET single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await db.select().from(roles).where(eq(roles.id, id)).limit(1);

    if (role.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(role[0]);
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// PATCH update role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update timestamp
    body.updatedAt = new Date();

    const updatedRole = await db
      .update(roles)
      .set(body)
      .where(eq(roles.id, id))
      .returning();

    if (updatedRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Invalidate roles cache
    revalidateTag("roles");

    return NextResponse.json(updatedRole[0]);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedRole = await db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning({ id: roles.id });

    if (deletedRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Invalidate roles cache
    revalidateTag("roles");

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
