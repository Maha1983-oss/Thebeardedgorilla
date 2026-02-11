# CSV Upload System - Backend API Solution

## Overview

This document describes the implementation of the **Backend API + Database** solution for CSV file management. With this system:

- **Admin** uploads CSV files once via the admin dashboard
- All data is stored in PostgreSQL database
- **Client1** and **Client2** automatically fetch and display the data
- No need for clients to re-upload files every time

---

## Architecture
aa
### Database Schema ss
hello

**Table:** `csv_uploads`

| Column       | Type        | Description                                                                  |
| ------------ | ----------- | ---------------------------------------------------------------------------- |
| `id`         | TEXT        | UUID primary key                                                             |
| `fileType`   | VARCHAR(50) | Type of CSV: 'shopify', 'tiktok', 'subscription', 'pl_client1', 'pl_client2' |
| `data`       | JSON        | Parsed CSV data stored as JSON                                               |
| `uploadedBy` | TEXT        | References users.id (admin who uploaded)                                     |
| `uploadedAt` | TIMESTAMP   | Upload timestamp                                                             |
| `isActive`   | BOOLEAN     | Only the latest upload per type is active                                    |

### API Endpoints

**`/api/csv-data`**

#### GET - Fetch CSV Data (All authenticated users)

```typescript
Response: {
  shopify: Array<Record<string, any>> | null,
  tiktok: Array<Record<string, any>> | null,
  subscription: Array<Record<string, any>> | null,
  pl_client1: Array<Record<string, any>> | null,
  pl_client2: Array<Record<string, any>> | null
}
```

Returns the latest active upload for each file type.

#### POST - Upload CSV Data (Admin only)

```typescript
Request: {
  fileType: "shopify" | "tiktok" | "subscription" | "pl_client1" | "pl_client2",
  data: Array<Record<string, any>>
}

Response: {
  message: "Data uploaded successfully",
  upload: {
    id: string,
    fileType: string,
    uploadedAt: string
  }
}
```

Deactivates old uploads and creates a new active upload.

---

## Implementation Details

### 1. Admin Dashboard (`/app/(protected)/page.tsx`)

**Features:**

- Upload interface for all 5 file types:
  - Shopify Orders (used by Client 1)
  - TikTok Orders (used by Client 1)
  - Subscriptions (used by Client 1)
  - P&L - Client 1 (separate P&L for Client 1)
  - P&L - Client 2 (separate P&L for Client 2)
- Parses CSV files using `papaparse` on the client
- Sends parsed JSON data to backend
- Shows upload status (uploaded/not uploaded)
- Visual feedback for successful uploads

**How it works:**

1. Admin selects a CSV file
2. File is parsed locally using PapaParse
3. Parsed data is sent to `POST /api/csv-data`
4. Backend stores data in database
5. Old uploads of same type are marked as inactive

### 2. Client1 Dashboard (`/components/client1.tsx`)

**Changes:**

- Removed file upload UI
- Auto-fetches data on component mount via `useEffect`
- Calls `GET /api/csv-data` to retrieve latest data
- Processes data automatically (no manual "Process" button)
- Shows loading state while fetching

**User Experience:**

1. Client1 logs in and navigates to `/client1`
2. Data automatically loads from server
3. Dashboard displays immediately with latest data
4. No need to upload files

### 3. Client2 Dashboard (`/components/client2.tsx`)

**Changes:**

- Removed P&L file upload UI
- Auto-fetches P&L data on component mount
- Calls `GET /api/csv-data` to retrieve latest P&L data
- Processes data automatically
- Shows loading state while fetching

**User Experience:**

1. Client2 logs in and navigates to `/client2`
2. P&L data automatically loads from server
3. Dashboard displays immediately with latest data
4. No need to upload files

---

## User Flow

### Admin Workflow

1. Login as admin → Redirected to `/` (Admin Dashboard)
2. See 5 upload cards for different file types:
   - Shopify Orders
   - TikTok Orders
   - Subscriptions
   - P&L - Client 1
   - P&L - Client 2
3. Click on any card to upload CSV
4. File is parsed and uploaded to database
5. Green checkmark indicates successful upload
6. Can re-upload any file to replace previous data

### Client1 Workflow

1. Login as client1 → Redirected to `/client1`
2. Dashboard automatically loads data from server
3. See "Loading data from server..." message briefly
4. Dashboard displays with charts, tables, and analytics
5. All data is from admin's latest uploads

### Client2 Workflow

1. Login as client2 → Redirected to `/client2`
2. Dashboard automatically loads P&L data from server
3. See "Loading P&L data from server..." message briefly
4. Dashboard displays with P&L analysis, projects, etc.
5. All data is from admin's latest uploads

---

## Files Modified

### Database

- **`lib/db/schema.ts`** - Added `csvUploads` table with JSON storage

### API Routes

- **`app/api/csv-data/route.ts`** (NEW) - GET and POST endpoints for CSV data

### Pages

- **`app/(protected)/page.tsx`** - Admin upload dashboard

### Components

- **`components/client1.tsx`** - Updated to auto-fetch data
- **`components/client2.tsx`** - Updated to auto-fetch data

---

## Key Features

✅ **Single Source of Truth** - Data stored in PostgreSQL database  
✅ **No Duplicate Uploads** - Clients don't need to upload files  
✅ **Version Control** - Previous uploads are marked inactive, not deleted  
✅ **Auto-Loading** - Data fetches automatically on page load  
✅ **Role-Based Access** - Only admins can upload, all authenticated users can view  
✅ **Type Safety** - Specific file types enforced (shopify, tiktok, subscription, pl_client1, pl_client2)  
✅ **Separate P&L Data** - Client1 and Client2 have independent P&L files  
✅ **Efficient Storage** - CSV data parsed to JSON for fast querying

---

## Error Handling

### If No Data Uploaded Yet

- Clients see error message: "No data available. Please contact your administrator to upload data."
- Admin can upload data immediately

### If Upload Fails

- Admin sees error message with details
- Previous data remains active and accessible

### If Network Error

- Component catches error and displays: "Error loading data: {message}"
- User can refresh page to retry

---

## Database Migration

The `csv_uploads` table is automatically created via Drizzle when you run:

```bash
npm run db:push
```

This was already executed during implementation.

---

## Testing Checklist

### Admin Tests

- [ ] Login as admin → Redirected to `/`
- [ ] See 5 upload cards (Shopify, TikTok, Subscriptions, P&L - Client 1, P&L - Client 2)
- [ ] Upload Shopify CSV → See success message
- [ ] Upload TikTok CSV → See success message
- [ ] Upload Subscription CSV → See success message
- [ ] Upload P&L - Client 1 CSV → See success message
- [ ] Upload P&L - Client 2 CSV → See success message
- [ ] Re-upload same file → Previous data replaced

### Client1 Tests

- [ ] Login as client1 → Redirected to `/client1`
- [ ] See loading message briefly
- [ ] Dashboard loads with data
- [ ] All charts and tables populate correctly
- [ ] No upload UI visible

### Client2 Tests

- [ ] Login as client2 → Redirected to `/client2`
- [ ] See loading message briefly
- [ ] P&L dashboard loads with data
- [ ] All P&L charts and tables populate correctly
- [ ] No upload UI visible

### Error Tests

- [ ] Client1 logs in before admin uploads → See error message
- [ ] Client2 logs in before admin uploads → See error message
- [ ] Admin re-uploads file → Clients see new data on refresh

---

## Benefits of This Solution

### Before (Solution 2 - Manual Upload)

- ❌ Each client had to upload files
- ❌ Duplicate data storage
- ❌ No single source of truth
- ❌ Users had to re-upload every session

### After (Solution 1 - Backend API)

- ✅ Admin uploads once
- ✅ All clients see same data
- ✅ Single source of truth
- ✅ Data persists across sessions
- ✅ Better user experience
- ✅ Centralized data management

---

## Future Enhancements

### Potential Improvements

1. **File Upload History** - Show list of previous uploads with timestamps
2. **Data Validation** - Validate CSV structure before accepting
3. **Scheduled Uploads** - Allow admins to schedule recurring data imports
4. **Data Export** - Allow clients to export processed data
5. **Real-time Updates** - Notify clients when admin uploads new data
6. **Batch Processing** - Process large files in background
7. **File Versioning** - Keep multiple versions and allow rollback

---

## Troubleshooting

### "No data available" Error

**Cause:** Admin hasn't uploaded files yet  
**Solution:** Admin should log in and upload CSV files from dashboard

### Data Not Updating

**Cause:** Browser cache  
**Solution:** Hard refresh page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Upload Fails

**Cause:** Invalid CSV format or network issue  
**Solution:**

1. Verify CSV file is properly formatted
2. Check console for detailed error
3. Try uploading a smaller file first

### Clients See Old Data

**Cause:** Cache or old session  
**Solution:** Log out and log back in, or refresh page

---

## API Response Examples

### Successful GET Request

```json
{
  "shopify": [
    { "Order ID": "12345", "Product": "7-Pouch Pack", "Quantity": 2 },
    { "Order ID": "12346", "Product": "14-Pouch Pack", "Quantity": 1 }
  ],
  "tiktok": [{ "Order Number": "TT-001", "SKU": "28-Pack", "Quantity": 3 }],
  "subscription": null,
  "pl_client1": null,
  "pl_client2": null
}
```

### Successful POST Request

```json
{
  "message": "Data uploaded successfully",
  "upload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fileType": "shopify",
    "uploadedAt": "2025-10-13T10:30:00.000Z"
  }
}
```

### Error Responses

```json
// Unauthorized (not logged in)
{ "error": "Unauthorized" }

// Forbidden (not admin)
{ "error": "Only admins can upload data" }

// Invalid request
{ "error": "Missing fileType or data" }
{ "error": "Invalid fileType" }
```

---

## Conclusion

The Backend API + Database solution provides a robust, scalable way to manage CSV data across multiple users. It eliminates redundant uploads, ensures data consistency, and improves the overall user experience for both admins and clients.

**All implementation is complete and ready for testing!** 🎉
