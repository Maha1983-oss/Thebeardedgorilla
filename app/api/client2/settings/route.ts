import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { client2Settings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET - Fetch settings for the current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings] = await db
      .select()
      .from(client2Settings)
      .where(eq(client2Settings.userId, session.id));

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        settings: {
          cashflowOpeningBalance: "0",
          ebitdaAdjustments: {},
          classifications: {},
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST/PUT - Create or update settings
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cashflowOpeningBalance, ebitdaAdjustments, classifications } = body;

    // Check if settings already exist
    const [existing] = await db
      .select()
      .from(client2Settings)
      .where(eq(client2Settings.userId, session.id));

    let settings;

    if (existing) {
      // Update existing settings
      [settings] = await db
        .update(client2Settings)
        .set({
          cashflowOpeningBalance:
            cashflowOpeningBalance !== undefined
              ? cashflowOpeningBalance
              : existing.cashflowOpeningBalance,
          ebitdaAdjustments:
            ebitdaAdjustments !== undefined
              ? ebitdaAdjustments
              : existing.ebitdaAdjustments,
          classifications:
            classifications !== undefined
              ? classifications
              : existing.classifications,
          updatedAt: new Date(),
        })
        .where(eq(client2Settings.userId, session.id))
        .returning();
    } else {
      // Create new settings
      [settings] = await db
        .insert(client2Settings)
        .values({
          userId: session.id,
          cashflowOpeningBalance: cashflowOpeningBalance || "0",
          ebitdaAdjustments: ebitdaAdjustments || {},
          classifications: classifications || {},
        })
        .returning();
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
