# Testing Chunked Upload Locally

## Step 1: Start Your Development Server

```bash
npm run dev
```

Your app should be running at `http://localhost:3000`

---

## Step 2: Create a Test CSV File

You have two options:

### Option A: Use Your Existing Large File
If you have a 2MB+ CSV file, you can use that directly.

### Option B: Create a Test File
Create a large CSV file for testing:

**Using Excel/Google Sheets:**
1. Create a CSV with many rows (e.g., 10,000+ rows)
2. Add enough columns to make it > 3.5MB when converted to JSON
3. Save as CSV

**Using Command Line (Mac/Linux):**
```bash
# Create a test CSV with 10,000 rows
echo "id,name,email,amount,date,description,category,status" > test-large.csv
for i in {1..10000}; do
  echo "$i,User$i,user$i@example.com,$((RANDOM % 10000)),2024-01-01,Transaction $i,Category$((i % 10)),Active" >> test-large.csv
done
```

**Using Python:**
```python
import csv
import random

# Create a large CSV file
with open('test-large.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'name', 'email', 'amount', 'date', 'description', 'category', 'status'])
    
    for i in range(1, 10000):
        writer.writerow([
            i,
            f'User{i}',
            f'user{i}@example.com',
            random.randint(100, 10000),
            '2024-01-01',
            f'Transaction {i}',
            f'Category{i % 10}',
            'Active'
        ])
```

---

## Step 3: Test the Upload

1. **Login as Admin**
   - Go to `http://localhost:3000/login`
   - Login with admin credentials
   - Navigate to `/data` page

2. **Upload Your Test File**
   - Select any file type (e.g., "Shopify Orders")
   - Click "Upload CSV"
   - Select your large CSV file

3. **What to Look For:**

   **For files > 3.5MB:**
   - ✅ You should see: "Large file detected, using chunked upload..."
   - ✅ Progress updates: "Uploading... 1/3 chunks", "2/3 chunks", etc.
   - ✅ Success message when complete

   **For files < 3.5MB:**
   - ✅ Normal upload (no chunking message)
   - ✅ Direct success message

---

## Step 4: Check Browser Console

Open browser DevTools (F12) and check the Console tab:

**Expected logs:**
```
🌐 Fetching CSV status from API...
✅ Cached 'csv-status' in localStorage
```

**For chunked uploads, you should see:**
- Multiple fetch requests to `/api/csv-data/chunk`
- Progress toast notifications
- Success message

---

## Step 5: Check Server Logs

In your terminal where `npm run dev` is running, you should see:

**For chunked uploads:**
```
POST /api/csv-data/chunk 200
POST /api/csv-data/chunk 200
POST /api/csv-data/chunk 200
✅ Processed X transactions
```

**For normal uploads:**
```
POST /api/csv-data 200
✅ Processed X transactions
```

---

## Step 6: Verify Data Was Saved

1. **Check the UI:**
   - After upload, the file status should show as "Uploaded" ✅
   - Green checkmark should appear

2. **Check Database (Optional):**
   ```bash
   # If using Drizzle Studio
   npm run db:studio
   ```
   - Check `csv_uploads` table
   - Verify your file type has the latest data

3. **Test in Client Dashboard:**
   - Navigate to `/client1` or `/client2` (depending on file type)
   - Verify data is displayed correctly

---

## Troubleshooting

### Issue: "File too large" error even with chunking
**Solution:** Check that the chunk route is working:
- Open Network tab in DevTools
- Look for requests to `/api/csv-data/chunk`
- Check if they're returning 200 status

### Issue: Chunks not combining
**Solution:** 
- Check server logs for errors
- Verify all chunks are being received (check `receivedChunks.size`)
- Check browser console for errors

### Issue: Upload hangs
**Solution:**
- Check if chunks are being uploaded sequentially
- Verify no network errors in DevTools
- Check server logs for processing errors

### Issue: Data not appearing after upload
**Solution:**
- Clear browser cache/localStorage
- Check database directly
- Verify file type matches what you uploaded

---

## Testing Different Scenarios

### Test 1: Small File (< 3.5MB)
- Should use normal upload
- Should work instantly
- No chunking messages

### Test 2: Medium File (3.5-5MB)
- Should automatically use chunked upload
- Should show progress messages
- Should complete successfully

### Test 3: Large File (> 5MB)
- Should use chunked upload
- Should show multiple progress updates
- Should handle gracefully

### Test 4: Failed Chunk Upload
- Try disconnecting network mid-upload
- Should show error message
- Should allow retry

---

## Quick Test Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Logged in as admin
- [ ] On `/data` page
- [ ] Have a test CSV file (> 3.5MB for chunking test)
- [ ] Browser DevTools open (Console + Network tabs)
- [ ] Terminal visible (for server logs)

---

## Expected Behavior Summary

| File Size | Behavior |
|-----------|----------|
| < 3.5MB | Normal upload (single request) |
| 3.5-10MB | Chunked upload (2-4 chunks) |
| > 10MB | Chunked upload (many chunks) |

All should complete successfully! ✅

---

## Need Help?

If something doesn't work:
1. Check browser console for errors
2. Check server terminal for errors
3. Check Network tab for failed requests
4. Share the error messages and I'll help debug!

