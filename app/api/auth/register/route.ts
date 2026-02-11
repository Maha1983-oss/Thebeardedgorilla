import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, insertUserSchema } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parseResult = insertUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, password, role, gender, phone, address } =
      parseResult.data;

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
        role: role ?? "admin",
        gender,
        phone,
        address,
      })
      .returning();

    return NextResponse.json(
      {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        message: "Registration successful",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
