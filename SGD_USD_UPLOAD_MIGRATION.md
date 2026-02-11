# SGD and USD Bank Transactions Upload Migration

## Summary

Successfully migrated SGD and USD bank transaction file uploads from the Client2 page to the Data Management page (admin-only access).

## Changes Made

### 1. Database Schema Updates (`lib/db/schema.ts`)

- Added two new file types to the CSV uploads schema:
  - `sgd_transactions` - For SGD bank statements
  - `usd_transactions` - For USD bank statements
- Updated validation schemas to include these new types

### 2. Data Page Updates (`app/(protected)/data/page.tsx`)

- Added two new upload cards:
  - **SGD Bank Transactions** (💰) - Upload SGD bank statement for cashflow visualization
  - **USD Bank Transactions** (💵) - Upload USD bank statement for cashflow visualization
- Updated upload status interface to track these new file types
- Added cache clearing for client2 data when SGD/USD transactions are uploaded or deleted

### 3. API Route Updates

#### `app/api/csv-data/route.ts`

- Updated GET endpoint to return `sgd_transactions` and `usd_transactions` data
- Updated POST endpoint to accept these new file types
- Updated DELETE endpoint to handle removal of these file types

#### `app/api/csv-data/status/route.ts`

- Updated status endpoint to include upload status for SGD and USD transactions

#### `app/api/csv-data/client2/route.ts`

- Enhanced endpoint to fetch not just P&L data, but also:
  - SGD transaction data
  - USD transaction data
- All three data types are now returned in a single API call for better performance

### 4. React Query Hook Updates (`lib/hooks/use-csv-data.ts`)

- Updated `CSVData` and `CSVStatus` interfaces to include new file types
- Enhanced `useClient2Data()` hook to return transaction data:
  - `pl_client2` - P&L data
  - `sgd_transactions` - SGD bank transactions with opening balance
  - `usd_transactions` - USD bank transactions with opening balances (USD and SGD)

### 5. Client2 Component Updates (`components/client2.tsx`)

#### Data Loading

- Added new `useEffect` hook that automatically loads SGD and USD transaction data from the API
- Transactions are now populated from the database instead of local file uploads
- Opening balances are also loaded from the database

#### UI Changes

- **Removed**: Upload sections for SGD and USD bank statements (lines 7166-7379)
- **Added**: Information banner showing:
  - Data is managed by administrators
  - Current status of SGD and USD transaction data
  - Number of transactions loaded
  - Message to contact administrator for uploads

#### Code Cleanup

- Removed unused state variables:
  - `bankTransactionsFile`
  - `usdTransactionsFile`
  - `processingBankTransactions`
  - `processingUsdTransactions`
  - `bankTransactionsStatus`
  - `usdTransactionsStatus`
- Removed upload handler functions (approximately 830 lines of code)
- Kept transaction display and visualization code intact

## Data Structure

When admins upload SGD or USD transaction files through the data page, the system now stores the processed data in this format:

```json
{
  "transactions": [
    {
      "id": "...",
      "date": "2024-01-15",
      "description": "Payment received",
      "category": "Revenue",
      "contact": "Client Name",
      "type": "inflow",
      "amount": "1000.00",
      "amountSGD": "1350.00" // Only for USD transactions
    }
  ],
  "openingBalance": 5000.0,
  "openingBalanceSGD": 6750.0 // Only for USD transactions
}
```

## User Experience Changes

### For Admins

- Admins now upload SGD and USD bank statement CSV files through the **Data Management** page
- Same CSV format requirements as before (Row 1: Headers, Row 2: Opening Balance, Row 3+: Transactions)
- Files are processed server-side and stored in the database
- Data is immediately available to Client2 users

### For Client2 Users

- Can no longer upload transaction files themselves
- Transaction data automatically loads when available
- See clear status messages about data availability
- Contact administrator if new data is needed
- All visualization and analysis features work the same as before

## Migration Notes

### CSV Processing

- The CSV processing logic (detecting columns, parsing dates, extracting opening balances) needs to be implemented server-side now
- This should be added to the `app/api/csv-data/route.ts` POST handler for `sgd_transactions` and `usd_transactions` file types
- The processing logic can be adapted from the removed client-side handlers

### Data Persistence

- Transaction data is now persisted in the database
- No need to re-upload files when refreshing the page
- Historical data is maintained until explicitly deleted

## Security Improvements

- ✅ Only admins can upload bank transaction files
- ✅ Centralized data management
- ✅ Better audit trail (uploads tracked in database)
- ✅ Consistent data across all users

## Performance Improvements

- ✅ Data cached at multiple levels (database, React Query, localStorage)
- ✅ No client-side CSV processing overhead
- ✅ Faster page loads (no need to process large CSV files)
- ✅ Reduced client-side memory usage

## Testing Checklist

- [ ] Admin can upload SGD transaction CSV file
- [ ] Admin can upload USD transaction CSV file
- [ ] Admin can delete uploaded transaction files
- [ ] Client2 users see transaction data after admin uploads
- [ ] Sankey diagram visualizations work correctly
- [ ] Opening balances are loaded correctly
- [ ] Combined SGD view works with both accounts
- [ ] No upload UI visible in Client2 Cashflow Sankey tab
- [ ] Information banner shows correct transaction counts

## Server-Side CSV Processing ✅

The server-side processing logic has been implemented in `/api/csv-data/route.ts`:

### Processing Function (`processTransactionData`)

When admins upload SGD or USD transaction CSV files, the server automatically:

1. **Detects Columns** - Finds Date, Description, Debit, Credit, and optional Category/Contact columns
2. **Validates Structure** - Ensures required columns are present
3. **Extracts Opening Balance** - Gets opening balance from Row 2 (first data row)
   - Debit value = positive balance
   - Credit value = negative balance
   - For USD files, also extracts SGD opening balance from SGD columns
4. **Processes Transactions** - Converts each row (starting from Row 3) into structured format:
   ```json
   {
     "id": "unique_id",
     "date": "2024-01-15",
     "description": "Transaction description",
     "category": "Revenue",
     "contact": "Contact name",
     "type": "inflow", // or "outflow"
     "amount": "1000.00",
     "amountSGD": "1350.00" // For USD transactions
   }
   ```
5. **Returns Structured Data**:
   ```json
   {
     "transactions": [...],
     "openingBalance": 5000.0,
     "openingBalanceSGD": 6750.0 // Only for USD
   }
   ```

### Error Handling

The processing function validates:

- ✅ CSV has data
- ✅ Required columns (Date, Description, Debit, Credit) exist
- ✅ Valid date formats
- ✅ Numeric amount values

Returns clear error messages if validation fails.

## Testing

- Test with sample SGD and USD CSV files
- Verify data loads correctly in Client2 Sankey tab
- Test with missing or malformed CSV files
- Verify cache invalidation works properly

## Files Modified

1. `lib/db/schema.ts` - Database schema
2. `app/(protected)/data/page.tsx` - Data management page
3. `app/api/csv-data/route.ts` - Main CSV API
4. `app/api/csv-data/status/route.ts` - Status API
5. `app/api/csv-data/client2/route.ts` - Client2 data API
6. `lib/hooks/use-csv-data.ts` - React Query hooks
7. `components/client2.tsx` - Client2 dashboard component

---

**Migration Date:** October 23, 2025
**Status:** ✅ Complete (including server-side CSV processing)

## How It Works Now

1. **Admin uploads CSV file** through Data Management page
2. **Server processes the file** automatically:
   - Detects columns
   - Extracts opening balance from Row 2
   - Converts transactions to structured format
   - Validates data
3. **Stores processed data** in database
4. **Client2 users** see data automatically in Cashflow Sankey tab
5. **No upload UI** visible to non-admin users

The entire flow is now seamless and secure!
