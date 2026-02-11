import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { csvUploads } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch only client2 P&L data
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow client2 and admin to access this endpoint
    if (session.role !== "client2" && session.role !== "admin") {
      return NextResponse.json(
        {
          error: "Access denied. Only client2 and admin can access this data.",
        },
        { status: 403 }
      );
    }

    // Get the latest pl_client2, sgd_transactions, and usd_transactions data
    const plData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "pl_client2"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    const sgdData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "sgd_transactions"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    const usdData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "usd_transactions"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    return NextResponse.json({
      pl_client2: plData.length > 0 ? plData[0].data : null,
      sgd_transactions: sgdData.length > 0 ? sgdData[0].data : null,
      usd_transactions: usdData.length > 0 ? usdData[0].data : null,
    });
  } catch (error) {
    console.error("Error fetching client2 data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
