# Solution: Increase File Upload Limit Using Vercel Blob

## Problem
Vercel has a **hard 4.5MB limit** for serverless function request bodies that **cannot be increased**.

## Solution: Use Vercel Blob Storage

Vercel Blob allows direct client-side uploads, bypassing the 4.5MB limit. Files can be up to **500MB** (or more on Pro plans).

---

## Step 1: Install Vercel Blob

```bash
npm install @vercel/blob
```

---

## Step 2: Set Up Environment Variable

Add to your `.env.local` and Vercel environment variables:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

**To get your token:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Or use Vercel CLI: `vercel env pull`

---

## Step 3: Create Upload URL API Route

Create `app/api/csv-upload-url/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can upload data" },
        { status: 403 }
      );
    }

    const { filename, contentType } = await request.json();

    // Generate upload URL
    const blob = await put(filename, request.body as any, {
      access: "public",
      contentType: contentType || "text/csv",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
```

---

## Step 4: Create Process Upload API Route

Create `app/api/csv-data/process/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { csvUploads } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can process data" },
        { status: 403 }
      );
    }

    const { blobUrl, fileType } = await request.json();

    // Download file from Blob
    const blob = await get(blobUrl);
    const text = await blob.text();

    // Parse CSV
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    // Process and save to database (use existing logic from csv-data/route.ts)
    // ... (copy your existing processing logic here)

    return NextResponse.json({ message: "Data processed successfully" });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
```

---

## Step 5: Update Client Upload Code

Modify `app/(protected)/data/page.tsx`:

```typescript
const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  fileType: string
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploading(true);
  setCurrentUpload(fileType);

  try {
    // Step 1: Get upload URL
    const urlResponse = await fetch("/api/csv-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: `${fileType}-${Date.now()}.csv`,
        contentType: "text/csv",
      }),
    });

    if (!urlResponse.ok) throw new Error("Failed to get upload URL");
    const { url } = await urlResponse.json();

    // Step 2: Upload file directly to Blob
    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": "text/csv",
      },
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload file");

    // Step 3: Process the uploaded file
    const processResponse = await fetch("/api/csv-data/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blobUrl: url,
        fileType,
      }),
    });

    if (!processResponse.ok) {
      const errorData = await processResponse.json();
      throw new Error(errorData.error || "Processing failed");
    }

    toast.success("File uploaded successfully!");
    // ... rest of your success handling
  } catch (error: any) {
    toast.error("Upload failed", {
      description: error.message,
    });
  } finally {
    setUploading(false);
    setCurrentUpload("");
  }
};
```

---

## Benefits

✅ **No 4.5MB limit** - Files up to 500MB+ supported  
✅ **Faster uploads** - Direct to storage, no serverless function bottleneck  
✅ **Better error handling** - Clear separation of upload vs processing  
✅ **Scalable** - Works for any file size  

---

## Alternative: Simpler Chunked Upload

If you prefer not to use Vercel Blob, we can implement chunked uploads where:
1. Split CSV into chunks on client
2. Upload chunks separately
3. Combine on server

This is more complex but doesn't require Vercel Blob setup.

---

## Which Solution Do You Prefer?

1. **Vercel Blob** (Recommended) - Clean, scalable, no limits
2. **Chunked Upload** - More complex but no external dependencies

Let me know which approach you'd like me to implement!

