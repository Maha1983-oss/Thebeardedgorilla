import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { csvUploads } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET - Fetch only upload status (lightweight - just true/false for each file type)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get only the file types that have active uploads (no data payload)
    const activeUploads = await db
      .select({
        fileType: csvUploads.fileType,
        uploadedAt: csvUploads.uploadedAt,
      })
      .from(csvUploads)
      .where(eq(csvUploads.isActive, true))
      .orderBy(desc(csvUploads.uploadedAt));

    // Create a lightweight status object
    const status = {
      shopify: false,
      tiktok: false,
      subscription: false,
      pl_client1: false,
      pl_client2: false,
      sgd_transactions: false,
      usd_transactions: false,
      pl_client3: false,
      cashflow_client3: false,
      pipeline_client3: false,
      sgd_sankey_client3: false,
      usd_sankey_client3: false,
    };

    // Mark which file types have been uploaded
    activeUploads.forEach((upload) => {
      if (upload.fileType in status) {
        status[upload.fileType as keyof typeof status] = true;
      }
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching CSV status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
