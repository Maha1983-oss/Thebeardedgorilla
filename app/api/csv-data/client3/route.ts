import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { csvUploads } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET - Fetch only client3 data
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow client3 and admin to access this endpoint
    if (session.role !== "client3" && session.role !== "admin") {
      return NextResponse.json(
        {
          error: "Access denied. Only client3 and admin can access this data.",
        },
        { status: 403 }
      );
    }

    // Get the latest data for all client3 file types
    const plData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "pl_client3"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    const cashflowData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "cashflow_client3"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    const pipelineData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "pipeline_client3"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    const sgdSankeyData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "sgd_sankey_client3"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    const usdSankeyData = await db
      .select()
      .from(csvUploads)
      .where(
        and(
          eq(csvUploads.fileType, "usd_sankey_client3"),
          eq(csvUploads.isActive, true)
        )
      )
      .orderBy(desc(csvUploads.uploadedAt))
      .limit(1);

    return NextResponse.json({
      pl_client3: plData.length > 0 ? plData[0].data : null,
      cashflow_client3: cashflowData.length > 0 ? cashflowData[0].data : null,
      pipeline_client3: pipelineData.length > 0 ? pipelineData[0].data : null,
      sgd_sankey_client3:
        sgdSankeyData.length > 0 ? sgdSankeyData[0].data : null,
      usd_sankey_client3:
        usdSankeyData.length > 0 ? usdSankeyData[0].data : null,
    });
  } catch (error) {
    console.error("Error fetching client3 data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
