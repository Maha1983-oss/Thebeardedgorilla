import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { csvUploads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Import processing functions from the main route
import { processTransactionData, extractCategoriesFromPLData } from "../route";

// In-memory storage for chunks (in production, use Redis or database)
// Key: uploadId, Value: { chunks: Map<number, any[]>, totalChunks: number, fileType: string }
const chunkStorage = new Map<
  string,
  {
    chunks: Map<number, any[]>;
    totalChunks: number;
    fileType: string;
    receivedChunks: Set<number>;
  }
>();

// Clean up old chunks (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [uploadId, data] of chunkStorage.entries()) {
    // Simple cleanup - in production, add timestamps
    if (data.receivedChunks.size === 0) {
      chunkStorage.delete(uploadId);
    }
  }
}, 60 * 60 * 1000);

// POST - Upload a chunk
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can upload data" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      uploadId,
      chunkIndex,
      totalChunks,
      fileType,
      chunkData,
    } = body;

    if (!uploadId || chunkIndex === undefined || !totalChunks || !fileType || !chunkData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Initialize storage for this upload if it doesn't exist
    if (!chunkStorage.has(uploadId)) {
      chunkStorage.set(uploadId, {
        chunks: new Map(),
        totalChunks,
        fileType,
        receivedChunks: new Set(),
      });
    }

    const upload = chunkStorage.get(uploadId)!;

    // Store the chunk
    upload.chunks.set(chunkIndex, chunkData);
    upload.receivedChunks.add(chunkIndex);

    // Check if all chunks are received
    const allChunksReceived =
      upload.receivedChunks.size === totalChunks;

    if (allChunksReceived) {
      // Combine all chunks in order
      const combinedData: any[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunk = upload.chunks.get(i);
        if (chunk) {
          combinedData.push(...chunk);
        }
      }

      // Process the combined data
      let processedData = combinedData;
      let extractedCategories: string[] = [];

      try {
        // Process transaction data if needed
        if (
          upload.fileType === "sgd_transactions" ||
          upload.fileType === "usd_transactions" ||
          upload.fileType === "sgd_sankey_client3" ||
          upload.fileType === "usd_sankey_client3"
        ) {
          const mappedType =
            upload.fileType === "sgd_sankey_client3"
              ? ("sgd_transactions" as const)
              : upload.fileType === "usd_sankey_client3"
              ? ("usd_transactions" as const)
              : (upload.fileType as "sgd_transactions" | "usd_transactions");
          processedData = processTransactionData(combinedData, mappedType);
        } else if (upload.fileType === "pl_client2") {
          // Extract categories from P&L data
          extractedCategories = extractCategoriesFromPLData(combinedData);
        }

        // Remove ALL previous uploads of this type
        await db.delete(csvUploads).where(eq(csvUploads.fileType, upload.fileType));

        // Insert new upload
        const [newUpload] = await db
          .insert(csvUploads)
          .values({
            fileType: upload.fileType,
            data: processedData,
            uploadedBy: session.id,
          })
          .returning();

        // Clean up chunks
        chunkStorage.delete(uploadId);

        // Return success response
        return NextResponse.json({
          complete: true,
          message: "Data uploaded successfully",
          upload: {
            id: newUpload.id,
            fileType: newUpload.fileType,
            uploadedAt: newUpload.uploadedAt,
          },
          ...(upload.fileType === "pl_client2" &&
            extractedCategories.length > 0 && {
              extractedCategories,
            }),
        });
      } catch (error: any) {
        // Clean up chunks on error
        chunkStorage.delete(uploadId);
        return NextResponse.json(
          {
            error: `Failed to process data: ${error.message}`,
            complete: false,
          },
          { status: 400 }
        );
      }
    }

    // Chunk received, waiting for more
    return NextResponse.json({
      complete: false,
      received: upload.receivedChunks.size,
      total: totalChunks,
    });
  } catch (error: any) {
    console.error("Error processing chunk:", error);
    return NextResponse.json(
      { error: "Failed to process chunk" },
      { status: 500 }
    );
  }
}

// GET - Check upload status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can check upload status" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json(
        { error: "Missing uploadId" },
        { status: 400 }
      );
    }

    const upload = chunkStorage.get(uploadId);
    if (!upload) {
      return NextResponse.json({
        found: false,
      });
    }

    return NextResponse.json({
      found: true,
      received: upload.receivedChunks.size,
      total: upload.totalChunks,
      complete: upload.receivedChunks.size === upload.totalChunks,
    });
  } catch (error) {
    console.error("Error checking upload status:", error);
    return NextResponse.json(
      { error: "Failed to check upload status" },
      { status: 500 }
    );
  }
}

