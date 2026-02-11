import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { csvUploads } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// For Next.js App Router - route segment config
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout for large file processing
export const dynamic = "force-dynamic";

// Helper function to process transaction CSV data
export function processTransactionData(
  rawData: any[],
  fileType: "sgd_transactions" | "usd_transactions"
) {
  if (!rawData || rawData.length === 0) {
    throw new Error("No data found in CSV file");
  }

  // Get headers from first row (object keys)
  const firstRow = rawData[0];
  const headers = Object.keys(firstRow);

  // Detect columns
  const dateColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return lower.includes("date") || lower.includes("transaction date");
  });

  const descColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return (
      lower.includes("description") ||
      lower.includes("particulars") ||
      lower.includes("details") ||
      lower.includes("narrative")
    );
  });

  const categoryColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return lower.includes("category");
  });

  const contactColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return lower === "contact" || lower.includes("contact");
  });

  const debitColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return (
      lower === "debit" || (lower.includes("debit") && !lower.includes("sgd"))
    );
  });

  const creditColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return (
      lower === "credit" || (lower.includes("credit") && !lower.includes("sgd"))
    );
  });

  const debitSGDColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return lower.includes("debit") && lower.includes("sgd");
  });

  const creditSGDColumn = headers.find((h) => {
    const lower = h.toLowerCase();
    return lower.includes("credit") && lower.includes("sgd");
  });

  if (!dateColumn || !descColumn) {
    throw new Error(
      `Missing required columns. Need Date and Description columns.`
    );
  }

  if (!debitColumn || !creditColumn) {
    throw new Error("Missing Debit/Credit columns");
  }

  // Extract opening balance from Row 2 (index 0)
  let openingBalance = 0;
  let openingBalanceSGD = 0;

  if (rawData.length > 0) {
    const row2 = rawData[0];

    if (debitColumn && creditColumn) {
      const debitValue = parseFloat(
        String(row2[debitColumn] || "0").replace(/[^0-9.-]/g, "")
      );
      const creditValue = parseFloat(
        String(row2[creditColumn] || "0").replace(/[^0-9.-]/g, "")
      );

      if (!isNaN(debitValue) && debitValue > 0) {
        openingBalance = debitValue;
      } else if (!isNaN(creditValue) && creditValue > 0) {
        openingBalance = -creditValue;
      }

      // For USD transactions, also get SGD opening balance
      if (
        fileType === "usd_transactions" &&
        debitSGDColumn &&
        creditSGDColumn
      ) {
        const debitSGDValue = parseFloat(
          String(row2[debitSGDColumn] || "0").replace(/[^0-9.-]/g, "")
        );
        const creditSGDValue = parseFloat(
          String(row2[creditSGDColumn] || "0").replace(/[^0-9.-]/g, "")
        );

        if (!isNaN(debitSGDValue) && debitSGDValue > 0) {
          openingBalanceSGD = debitSGDValue;
        } else if (!isNaN(creditSGDValue) && creditSGDValue > 0) {
          openingBalanceSGD = -creditSGDValue;
        }
      }
    }
  }

  // Process transactions (skip Row 2, start from index 1)
  const transactions = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const dateValue = row[dateColumn];
    const descValue = row[descColumn];

    if (!dateValue || !descValue) continue;

    // Parse date
    let parsedDate;
    try {
      parsedDate = new Date(dateValue);
      if (isNaN(parsedDate.getTime())) {
        const parts = String(dateValue).split("/");
        if (parts.length === 3) {
          parsedDate = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
        }
      }
      if (isNaN(parsedDate.getTime())) {
        continue;
      }
    } catch (e) {
      continue;
    }

    const formattedDate = parsedDate.toISOString().split("T")[0];

    // Determine amount and type
    let amount = 0;
    let amountSGD = 0;
    let type = "inflow";

    if (debitColumn && creditColumn) {
      const debitValue = parseFloat(
        String(row[debitColumn] || "0").replace(/[^0-9.-]/g, "")
      );
      const creditValue = parseFloat(
        String(row[creditColumn] || "0").replace(/[^0-9.-]/g, "")
      );

      if (!isNaN(debitValue) && debitValue > 0) {
        amount = Math.abs(debitValue);
        type = "inflow";
      } else if (!isNaN(creditValue) && creditValue > 0) {
        amount = Math.abs(creditValue);
        type = "outflow";
      } else {
        continue;
      }

      // For USD transactions, also get SGD amounts
      if (
        fileType === "usd_transactions" &&
        debitSGDColumn &&
        creditSGDColumn
      ) {
        const debitSGDValue = parseFloat(
          String(row[debitSGDColumn] || "0").replace(/[^0-9.-]/g, "")
        );
        const creditSGDValue = parseFloat(
          String(row[creditSGDColumn] || "0").replace(/[^0-9.-]/g, "")
        );

        if (!isNaN(debitSGDValue) && debitSGDValue > 0) {
          amountSGD = Math.abs(debitSGDValue);
        } else if (!isNaN(creditSGDValue) && creditSGDValue > 0) {
          amountSGD = Math.abs(creditSGDValue);
        }
      }
    }

    // For SGD transactions, SGD amount is same as amount
    if (fileType === "sgd_transactions") {
      amountSGD = amount;
    }

    transactions.push({
      id: Date.now() + Math.random(),
      date: formattedDate,
      description: String(descValue).trim(),
      category: categoryColumn
        ? String(row[categoryColumn] || "").trim() || "Uncategorized"
        : "Uncategorized",
      contact: contactColumn ? String(row[contactColumn] || "").trim() : "",
      type: type,
      amount: amount.toFixed(2),
      amountSGD: amountSGD.toFixed(2),
    });
  }

  console.log(`✅ Processed ${transactions.length} ${fileType} transactions`);
  console.log(
    `📊 Opening Balance: ${openingBalance} (type: ${typeof openingBalance})`
  );
  if (fileType === "usd_transactions") {
    console.log(
      `📊 Opening Balance (SGD): ${openingBalanceSGD} (type: ${typeof openingBalanceSGD})`
    );
  }
  console.log(`📝 Sample transaction:`, transactions[0]);

  const result = {
    transactions,
    openingBalance: Number(openingBalance), // Ensure it's a number
    ...(fileType === "usd_transactions" && {
      openingBalanceSGD: Number(openingBalanceSGD),
    }),
  };

  console.log(`📦 Returning data structure:`, {
    transactionCount: result.transactions.length,
    openingBalance: result.openingBalance,
    openingBalanceType: typeof result.openingBalance,
    ...(fileType === "usd_transactions" && {
      openingBalanceSGD: result.openingBalanceSGD,
      openingBalanceSGDType: typeof result.openingBalanceSGD,
    }),
  });

  return result;
}

// Helper function to extract categories from P&L data
export function extractCategoriesFromPLData(rawData: any[]): string[] {
  if (!rawData || rawData.length === 0) {
    throw new Error("No data found in P&L CSV file");
  }

  const categories = new Set<string>();

  // Look for category/class columns in the data
  const firstRow = rawData[0];
  const headers = Object.keys(firstRow);

  // Common column names that might contain categories
  const categoryColumnNames = [
    "category",
    "class",
    "classification",
    "line_item",
    "description",
    "account",
    "account_name",
    "item",
    "type",
    "category_name",
  ];

  // Find the category column
  let categoryColumn = null;
  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();
    if (categoryColumnNames.some((name) => lowerHeader.includes(name))) {
      categoryColumn = header;
      break;
    }
  }

  if (!categoryColumn) {
    // If no specific category column found, try to use the first text column
    const textColumns = headers.filter((header) => {
      const value = firstRow[header];
      return typeof value === "string" && value.trim().length > 0;
    });

    if (textColumns.length > 0) {
      categoryColumn = textColumns[0];
    } else {
      throw new Error("No suitable category column found in P&L data");
    }
  }

  // Extract unique categories
  for (const row of rawData) {
    const categoryValue = row[categoryColumn];
    if (categoryValue && typeof categoryValue === "string") {
      const trimmed = categoryValue.trim();
      if (trimmed.length > 0) {
        categories.add(trimmed);
      }
    }
  }

  const categoryArray = Array.from(categories).sort();
  console.log(
    `✅ Extracted ${categoryArray.length} categories from P&L data:`,
    categoryArray
  );

  return categoryArray;
}

// GET - Fetch CSV data (all authenticated users can read)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the latest active uploads for each file type
    const data = await db
      .select()
      .from(csvUploads)
      .where(eq(csvUploads.isActive, true))
      .orderBy(desc(csvUploads.uploadedAt));

    // Group by fileType and get the most recent for each type
    const latestData: Record<string, any> = {};
    data.forEach((upload) => {
      if (!latestData[upload.fileType]) {
        latestData[upload.fileType] = upload.data;
      }
    });

    return NextResponse.json({
      shopify: latestData.shopify || null,
      tiktok: latestData.tiktok || null,
      subscription: latestData.subscription || null,
      pl_client1: latestData.pl_client1 || null,
      pl_client2: latestData.pl_client2 || null,
      sgd_transactions: latestData.sgd_transactions || null,
      usd_transactions: latestData.usd_transactions || null,
      pl_client3: latestData.pl_client3 || null,
      cashflow_client3: latestData.cashflow_client3 || null,
      pipeline_client3: latestData.pipeline_client3 || null,
      sgd_sankey_client3: latestData.sgd_sankey_client3 || null,
      usd_sankey_client3: latestData.usd_sankey_client3 || null,
    });
  } catch (error) {
    console.error("Error fetching CSV data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

// POST - Upload CSV data (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can upload data" },
        { status: 403 }
      );
    }

    // Parse request body with better error handling for large files
    let body;
    try {
      body = await request.json();
    } catch (error: any) {
      console.error("Error parsing request body:", error);
      // Check if it's a body size issue
      if (error.message?.includes("body") || error.message?.includes("size")) {
        return NextResponse.json(
          {
            error:
              "File too large. Vercel has a 4.5MB limit for request bodies. Please split your CSV file or reduce its size.",
          },
          { status: 413 }
        );
      }
      return NextResponse.json(
        { error: "Invalid request body. Please check your file format." },
        { status: 400 }
      );
    }

    const { fileType, data } = body;

    if (!fileType || !data) {
      return NextResponse.json(
        { error: "Missing fileType or data" },
        { status: 400 }
      );
    }

    // Validate fileType
    if (
      ![
        "shopify",
        "tiktok",
        "subscription",
        "pl_client1",
        "pl_client2",
        "sgd_transactions",
        "usd_transactions",
        "pl_client3",
        "cashflow_client3",
        "pipeline_client3",
        "sgd_sankey_client3",
        "usd_sankey_client3",
      ].includes(fileType)
    ) {
      return NextResponse.json({ error: "Invalid fileType" }, { status: 400 });
    }

    // Process transaction data if it's SGD or USD transactions
    let processedData = data;
    let extractedCategories: string[] = [];

    if (
      fileType === "sgd_transactions" ||
      fileType === "usd_transactions" ||
      fileType === "sgd_sankey_client3" ||
      fileType === "usd_sankey_client3"
    ) {
      try {
        const mappedType =
          fileType === "sgd_sankey_client3"
            ? ("sgd_transactions" as const)
            : fileType === "usd_sankey_client3"
            ? ("usd_transactions" as const)
            : (fileType as "sgd_transactions" | "usd_transactions");
        processedData = processTransactionData(data, mappedType);
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to process transaction data: ${error.message}` },
          { status: 400 }
        );
      }
    } else if (fileType === "pl_client2") {
      // Extract categories from P&L data
      try {
        extractedCategories = extractCategoriesFromPLData(data);
      } catch (error: any) {
        return NextResponse.json(
          {
            error: `Failed to extract categories from P&L data: ${error.message}`,
          },
          { status: 400 }
        );
      }
    }

    // Remove ALL previous uploads of this type (hard delete)
    await db.delete(csvUploads).where(eq(csvUploads.fileType, fileType));

    // Insert new upload
    const [newUpload] = await db
      .insert(csvUploads)
      .values({
        fileType,
        data: processedData,
        uploadedBy: session.id,
      })
      .returning();

    return NextResponse.json({
      message: "Data uploaded successfully",
      upload: {
        id: newUpload.id,
        fileType: newUpload.fileType,
        uploadedAt: newUpload.uploadedAt,
      },
      // Include extracted categories for pl_client2
      ...(fileType === "pl_client2" &&
        extractedCategories.length > 0 && {
          extractedCategories,
        }),
    });
  } catch (error) {
    console.error("Error uploading CSV data:", error);
    return NextResponse.json(
      { error: "Failed to upload data" },
      { status: 500 }
    );
  }
}

// DELETE - Remove CSV data for a given fileType (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete data" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("fileType");

    if (
      !fileType ||
      ![
        "shopify",
        "tiktok",
        "subscription",
        "pl_client1",
        "pl_client2",
        "sgd_transactions",
        "usd_transactions",
        "pl_client3",
        "cashflow_client3",
        "pipeline_client3",
        "sgd_sankey_client3",
        "usd_sankey_client3",
      ].includes(fileType)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing fileType" },
        { status: 400 }
      );
    }

    // Hard-delete all uploads for this file type
    await db.delete(csvUploads).where(eq(csvUploads.fileType, fileType));

    return NextResponse.json({
      message: "Data deleted successfully",
      fileType,
    });
  } catch (error) {
    console.error("Error deleting CSV data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
