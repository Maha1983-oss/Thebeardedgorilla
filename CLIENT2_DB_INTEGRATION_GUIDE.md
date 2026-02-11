# Client2 Database Integration Guide

## ✅ Completed Steps

1. **Database Schema Created** (`lib/db/schema.ts`)

   - `cashflowTransactions` table
   - `pipelineDeals` table
   - `projects` table
   - `projectCosts` table
   - `client2Settings` table (for opening balance, EBITDA adjustments, classifications)

2. **API Routes Created**

   - `/api/client2/cashflow` - CRUD for cashflow transactions
   - `/api/client2/pipeline` - CRUD for pipeline deals
   - `/api/client2/projects` - CRUD for projects
   - `/api/client2/project-costs` - CRUD for project costs
   - `/api/client2/settings` - GET/POST for settings

3. **React Query Hooks Created** (`lib/hooks/use-client2-data.ts`)

   - Data fetching hooks for all entities
   - Mutation hooks for all CRUD operations

4. **Client2 Component Updated**
   - ✅ Imports added
   - ✅ Hooks initialized
   - ✅ Data loading from database
   - ✅ Settings loading

## 🔨 Remaining Implementation

### Code Locations to Update in `components/client2.tsx`

The file is over 10,500 lines. Below are the key sections that need updating:

####
