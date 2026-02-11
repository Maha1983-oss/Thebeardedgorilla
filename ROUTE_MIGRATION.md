# Route Migration Guide

## Overview

All routes have been simplified by removing the `/dashboard` prefix. This makes URLs cleaner and more intuitive.

## Route Changes

### Main Routes

| Old Route                 | New Route       | Description                |
| ------------------------- | --------------- | -------------------------- |
| `/dashboard`              | `/`             | Analytics Dashboard (Home) |
| `/dashboard/client1`      | `/client1`      | Client 1 Portal            |
| `/dashboard/client2`      | `/client2`      | Client 2 Portal            |
| `/dashboard/users`        | `/users`        | User Management            |
| `/dashboard/users/roles`  | `/users/roles`  | Role Management            |
| `/dashboard/account`      | `/account`      | Account Settings           |
| `/dashboard/setting`      | `/setting`      | General Settings           |
| `/dashboard/unauthorized` | `/unauthorized` | Access Denied Page         |

### Auth Routes (Unchanged)

| Route     | Description |
| --------- | ----------- |
| `/login`  | Login Page  |
| `/signup` | Signup Page |

### API Routes (Unchanged)

All API routes remain the same:

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management endpoints
- `/api/roles/*` - Role management endpoints

## Technical Implementation

### Route Groups

The app now uses Next.js 13+ route groups for better organization:

```
app/
├── (auth)/           # Routes without sidebar
│   ├── login/
│   └── signup/
├── (protected)/      # Routes with sidebar layout
│   ├── page.tsx      # Home (/)
│   ├── layout.tsx    # Sidebar layout
│   ├── client1/
│   ├── client2/
│   ├── users/
│   ├── account/
│   ├── setting/
│   └── unauthorized/
├── api/              # API routes
└── layout.tsx        # Root layout
```

Route groups `(auth)` and `(protected)` don't appear in URLs - they're purely for organization and applying different layouts.

## What Changed

### Files Updated

1. **Middleware** (`middleware.ts`)

   - Updated `protectedRoutes` array
   - Updated `roleRoutes` configuration
   - Updated redirect URLs

2. **Components**

   - `app-sidebar.tsx` - Updated navigation URLs
   - `site-header.tsx` - Updated breadcrumb mappings
   - `login-form.tsx` - Updated post-login redirects
   - `nav-user.tsx` - Updated account page link

3. **Pages**
   - All page files moved to appropriate route groups
   - Updated internal links and redirects

### Middleware Configuration

```typescript
// Routes that require authentication
const protectedRoutes = [
  "/client1",
  "/client2",
  "/users",
  "/account",
  "/setting",
  "/unauthorized",
];

// Role-specific allowed routes
const roleRoutes: Record<string, string[]> = {
  admin: [
    "/",
    "/users",
    "/client1",
    "/client2",
    "/account",
    "/setting",
    "/unauthorized",
  ],
  client1: ["/", "/client1", "/account", "/setting", "/unauthorized"],
  client2: ["/", "/client2", "/account", "/setting", "/unauthorized"],
};
```

## User Experience

### For Admin Users

After login:

- Redirected to `/` (Analytics Dashboard)
- Can access all routes
- Sidebar shows all navigation items

### For Client1 Users

After login:

- Redirected to `/client1`
- Can only access: `/client1`, `/account`, `/setting`
- Sidebar shows: Client 1, Settings
- Attempting to access other routes → `/unauthorized`

### For Client2 Users

After login:

- Redirected to `/client2`
- Can only access: `/client2`, `/account`, `/setting`
- Sidebar shows: Client 2, Settings
- Attempting to access other routes → `/unauthorized`

## Migration Checklist

- ✅ Moved all pages to new route structure
- ✅ Updated middleware route protection
- ✅ Updated all navigation links
- ✅ Updated breadcrumbs
- ✅ Updated post-login redirects
- ✅ Updated internal page links
- ✅ Tested role-based access control
- ✅ Cleaned up old dashboard directory

## Benefits

1. **Cleaner URLs**: `/client1` instead of `/dashboard/client1`
2. **Better UX**: Shorter, more memorable URLs
3. **Simpler Structure**: Fewer nested directories
4. **Maintained Functionality**: All features work exactly the same
5. **Better Organization**: Route groups separate auth vs protected pages

## Testing

To test the new routes:

1. Start the dev server:

   ```bash
   npm run dev
   ```

2. Test as Admin:

   - Login → Should redirect to `/` (Analytics)
   - Navigate to `/users` → Should work
   - Check sidebar → All items visible

3. Test as Client1:

   - Login → Should redirect to `/client1`
   - Try accessing `/users` → Should redirect to `/unauthorized`
   - Check sidebar → Only Client 1 and Settings visible

4. Test as Client2:
   - Login → Should redirect to `/client2`
   - Try accessing `/client1` → Should redirect to `/unauthorized`
   - Check sidebar → Only Client 2 and Settings visible

## Notes

- The home route `/` now shows the analytics dashboard (previously `/dashboard`)
- Non-admin users trying to access `/` are automatically redirected to their respective client portals
- All role-based access control remains intact
- Session management and authentication work exactly as before
