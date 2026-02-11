import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles, insertRoleSchema } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache, revalidateTag } from "next/cache";

// Cached function to fetch all roles
const getCachedRoles = unstable_cache(
  async () => {
    const allRoles = await db.select().from(roles);
    return allRoles;
  },
  ["all-roles"],
  {
    revalidate: 120, // Cache for 2 minutes
    tags: ["roles"],
  }
);

// GET all roles
export async function GET() {
  try {
    const allRoles = await getCachedRoles();
    return NextResponse.json(allRoles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = insertRoleSchema.parse(body);

    // Check if role already exists
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, validatedData.name))
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 400 }
      );
    }

    // Create role
    const newRole = await db.insert(roles).values(validatedData).returning();

    // Invalidate roles cache
    revalidateTag("roles");

    return NextResponse.json(newRole[0], { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
