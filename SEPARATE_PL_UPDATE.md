# Separate P&L Files Update

## Summary

Updated the CSV upload system to support **separate P&L files** for Client1 and Client2, instead of sharing a single P&L file.

---

## What Changed

### Before:

- 4 upload options:
  1. Shopify Orders
  2. TikTok Orders
  3. Subscriptions
  4. P&L (shared by both clients)

### After:

- 5 upload options:
  1. Shopify Orders (Client 1)
  2. TikTok Orders (Client 1)
  3. Subscriptions (Client 1)
  4. **P&L - Client 1** (separate)
  5. **P&L - Client 2** (separate)

---

## Files Modified

### 1. Database Schema (`lib/db/schema.ts`)

- Updated `fileType` enum from `"pl"` to `"pl_client1"` and `"pl_client2"`
- Both in the table definition and Zod validation schema

### 2. API Endpoint (`app/api/csv-data/route.ts`)

**GET Response:**

```typescript
{
  shopify: ... | null,
  tiktok: ... | null,
  subscription: ... | null,
  pl_client1: ... | null,  // NEW
  pl_client2: ... | null   // NEW
}
```

**POST Validation:**

- Updated to accept `"pl_client1"` and `"pl_client2"` as valid file types

### 3. Admin Dashboard (`app/(protected)/page.tsx`)

**Interface Update:**

```typescript
interface UploadStatus {
  shopify: boolean;
  tiktok: boolean;
  subscription: boolean;
  pl_client1: boolean; // Changed from 'pl'
  pl_client2: boolean; // NEW
}
```

**Upload Cards:**

- Now shows 5 cards instead of 4
- "P&L (QuickBooks)" split into:
  - "P&L - Client 1" (orange gradient)
  - "P&L - Client 2" (pink gradient)

### 4. Client1 Component (`components/client1.tsx`)

**Changes:**

- Checks for `data.pl_client1` instead of `data.pl`
- Fetches and processes Client 1's P&L data only
- Comment updated: "Process P&L data (Client 1)"

### 5. Client2 Component (`components/client2.tsx`)

**Changes:**

- Checks for `data.pl_client2` instead of `data.pl`
- Fetches and processes Client 2's P&L data only
- Comment updated: "Check if P&L data exists (Client 2)"

### 6. Documentation (`CSV_UPLOAD_SYSTEM.md`)

Updated all references to reflect the new structure:

- Database schema table
- API endpoint examples
- User workflows
- Testing checklist
- Key features

---

## How It Works Now

### Admin (at `/`)

1. Sees **5 upload cards**
2. Uploads separate CSV files for:
   - Client 1 data (Shopify, TikTok, Subscriptions, P&L)
   - Client 2 data (P&L only)
3. Each client gets their own P&L data

### Client 1 (at `/client1`)

1. Auto-fetches: `shopify`, `tiktok`, `subscription`, `pl_client1`
2. Processes and displays Client 1's P&L data
3. Does NOT see Client 2's P&L data

### Client 2 (at `/client2`)

1. Auto-fetches: `pl_client2`
2. Processes and displays Client 2's P&L data
3. Does NOT see Client 1's P&L data

---

## Database Migration

The schema change requires updating the database:

```bash
npm run db:push
```

This will update the `csv_uploads` table to accept the new file types.

---

## Testing

### Test Admin Upload

1. Login as `admin@example.com` / `admin123`
2. Navigate to `/` (Admin Dashboard)
3. You should see **5 upload cards**
4. Upload P&L files separately for Client 1 and Client 2

### Test Client 1

1. Login as `client1@example.com` / `client123`
2. Navigate to `/client1`
3. Should load Client 1's P&L data (from `pl_client1`)

### Test Client 2

1. Login as `client2@example.com` / `client123`
2. Navigate to `/client2`
3. Should load Client 2's P&L data (from `pl_client2`)

---

## Benefits

✅ **Data Isolation** - Each client has their own P&L data  
✅ **Flexibility** - Admin can upload different P&L files for each client  
✅ **Privacy** - Clients cannot see each other's P&L data  
✅ **Independent Updates** - Update one client's data without affecting the other

---

## Migration Notes

### Existing Data

If you previously uploaded P&L data with the `"pl"` file type:

- That data will remain in the database
- But it won't be displayed to any client
- You'll need to re-upload the P&L data as:
  - `pl_client1` for Client 1
  - `pl_client2` for Client 2

### Clean Start

If starting fresh:

- Just upload new P&L files using the new upload cards
- System will work automatically

---

## Conclusion

The system now supports **fully independent P&L files** for Client 1 and Client 2, giving you complete flexibility in managing separate financial data for each client. 🎉
