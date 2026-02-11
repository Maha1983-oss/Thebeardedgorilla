# Role-Based Access Control (RBAC) Guide

## 🔐 Overview

The application now has a complete Role-Based Access Control system where different user roles have different permissions and see different content.

## 👥 User Roles & Permissions

### 1. **Admin Role**

**Access Level:** Full access to everything

**Sidebar Navigation:**

- ✅ Dashboard (Analytics)
- ✅ Client 1
- ✅ Client 2
- ✅ User Management
  - All Users
  - Roles
  - Permissions
- ✅ Settings
  - Account
  - Team
  - Billing
  - Limits

**Accessible Routes:**

- `/` - Analytics Dashboard
- `/client1` - Client 1 Portal
- `/client2` - Client 2 Portal
- `/users` - User Management
- `/users/roles` - Role Management
- `/account` - Account Settings
- `/setting` - Settings

**After Login:** Redirected to `/` (Analytics)

---

### 2. **Client1 Role**

**Access Level:** Limited to Client 1 portal and Settings only

**Sidebar Navigation:**

- ✅ Client 1
- ✅ Settings
  - Account
  - Team
  - Billing
  - Limits

**Accessible Routes:**

- `/client1` - Client 1 Portal (their main page)
- `/account` - Account Settings
- `/setting` - Settings

**Blocked Routes:**

- ❌ `/` (Analytics) - Admin only
- ❌ `/client2` - Client2 only
- ❌ `/users` - Admin only
- ❌ `/users/roles` - Admin only

**After Login:** Redirected to `/client1`

**If Tries to Access Blocked Route:**

- Automatically redirected to `/unauthorized`
- Shows "Access Denied" message
- Message: "Only administrators can access this page"

---

### 3. **Client2 Role**

**Access Level:** Limited to Client 2 portal and Settings only

**Sidebar Navigation:**

- ✅ Client 2
- ✅ Settings
  - Account
  - Team
  - Billing
  - Limits

**Accessible Routes:**

- `/client2` - Client 2 Portal (their main page)
- `/account` - Account Settings
- `/setting` - Settings

**Blocked Routes:**

- ❌ `/` (Analytics) - Admin only
- ❌ `/client1` - Client1 only
- ❌ `/users` - Admin only
- ❌ `/users/roles` - Admin only

**After Login:** Redirected to `/client2`

**If Tries to Access Blocked Route:**

- Automatically redirected to `/unauthorized`
- Shows "Access Denied" message
- Message: "Only administrators can access this page"

---

## 🛡️ How It Works

### Middleware Protection

**Location:** `/middleware.ts`

The middleware checks every request to dashboard routes and:

1. **Verifies Authentication**

   - Not logged in? → Redirect to `/login`

2. **Checks Role Permissions**

   - Compares requested route with allowed routes for user's role
   - Not allowed? → Redirect to `/unauthorized`

3. **Auto-Redirects Based on Role**
   - Admin visits `/` → Show Analytics Dashboard
   - Client1 visits `/` → Redirect to `/client1`
   - Client2 visits `/` → Redirect to `/client2`

### Dynamic Sidebar

**Location:** `/components/app-sidebar.tsx`

The sidebar filters navigation items based on user role:

```typescript
// Admin sees everything
if (user.role === "admin") {
  return navMain; // All items
}

// Client1 sees only Client 1 + Settings
if (user.role === "client1") {
  return navMain.filter(
    (item) => item.title === "Client 1" || item.title === "Settings"
  );
}

// Client2 sees only Client 2 + Settings
if (user.role === "client2") {
  return navMain.filter(
    (item) => item.title === "Client 2" || item.title === "Settings"
  );
}
```

### Unauthorized Page

**Location:** `/app/(protected)/unauthorized/page.tsx`

Beautiful error page shown when user tries to access forbidden routes:

- Shield icon with red styling
- "Access Denied" heading
- Clear message: "Only administrators can access this page"
- "Go Back" button to return to their dashboard

---

## 🧪 Testing the RBAC System

### Test as Admin

```bash
# Login as admin
Email: admin@example.com
Password: admin123
```

**Expected Behavior:**

1. ✅ Redirected to `/` (Analytics)
2. ✅ Sidebar shows: Dashboard, Client 1, Client 2, User Management, Settings
3. ✅ Can access all pages
4. ✅ Can visit `/users` to manage users
5. ✅ Can visit `/client1` and `/client2`

---

### Test as Client1

```bash
# Login as client1
Email: client1@example.com
Password: client123
```

**Expected Behavior:**

1. ✅ Redirected to `/client1` (Client 1 Portal)
2. ✅ Sidebar shows ONLY: Client 1, Settings
3. ✅ Cannot see Dashboard, Client 2, User Management in sidebar
4. ❌ Try to visit `/users` manually → Redirected to "Access Denied"
5. ❌ Try to visit `/` manually → Redirected to `/client1`
6. ❌ Try to visit `/client2` → Redirected to "Access Denied"
7. ✅ Can access `/account` (Account Settings)
8. ✅ Can access `/setting` (Settings)

---

### Test as Client2

```bash
# Login as client2
Email: client2@example.com
Password: client123
```

**Expected Behavior:**

1. ✅ Redirected to `/client2` (Client 2 Portal)
2. ✅ Sidebar shows ONLY: Client 2, Settings
3. ✅ Cannot see Dashboard, Client 1, User Management in sidebar
4. ❌ Try to visit `/users` manually → Redirected to "Access Denied"
5. ❌ Try to visit `/` manually → Redirected to `/client2`
6. ❌ Try to visit `/client1` → Redirected to "Access Denied"
7. ✅ Can access `/account` (Account Settings)
8. ✅ Can access `/setting` (Settings)

---

## 📊 Permission Matrix

| Route           | Admin | Client1                   | Client2                   |
| --------------- | ----- | ------------------------- | ------------------------- |
| `/` (Analytics) | ✅    | ❌ (redirects to client1) | ❌ (redirects to client2) |
| `/client1`      | ✅    | ✅                        | ❌                        |
| `/client2`      | ✅    | ❌                        | ✅                        |
| `/users`        | ✅    | ❌                        | ❌                        |
| `/users/roles`  | ✅    | ❌                        | ❌                        |
| `/account`      | ✅    | ✅                        | ✅                        |
| `/setting`      | ✅    | ✅                        | ✅                        |
| `/unauthorized` | ✅    | ✅ (when blocked)         | ✅ (when blocked)         |

---

## 🎨 Sidebar Visibility Matrix

| Navigation Item | Admin | Client1 | Client2 |
| --------------- | ----- | ------- | ------- |
| Dashboard       | ✅    | ❌      | ❌      |
| Client 1        | ✅    | ✅      | ❌      |
| Client 2        | ✅    | ❌      | ✅      |
| User Management | ✅    | ❌      | ❌      |
| Settings        | ✅    | ✅      | ✅      |

---

## 🔧 Customization

### Add a New Route for Client1

In `/middleware.ts`, update the `roleRoutes` object:

```typescript
const roleRoutes: Record<string, string[]> = {
  client1: [
    "/",
    "/client1",
    "/account",
    "/setting",
    "/new-route", // Add here
    "/unauthorized",
  ],
  // ...
};
```

### Add a New Sidebar Item for Client1

In `/components/app-sidebar.tsx`, add to `navMain` array, then it will automatically appear for Client1:

```typescript
{
  title: "Client 1",
  url: "/client1",
  icon: Users,
  isActive: true,
},
// Add new item here (will be filtered by role)
```

Or modify the filter logic in `getFilteredNavItems()`.

### Change Access Denied Message

Edit `/app/(protected)/unauthorized/page.tsx`:

```typescript
<CardDescription className="text-base">
  Only administrators can access this page // Change this
</CardDescription>
```

### Add More Granular Permissions

You can extend the middleware to check sub-permissions:

```typescript
const permissions = {
  admin: ["read:all", "write:all", "delete:all"],
  client1: ["read:client1", "write:client1"],
  client2: ["read:client2", "write:client2"],
};
```

---

## 🐛 Troubleshooting

### Client Can See Admin Routes in Sidebar

**Issue:** Navigation items not filtering properly

**Solution:** Check that user role is being passed to AppSidebar:

1. Verify `/components/sidebar-wrapper.tsx` is fetching role
2. Check `getFilteredNavItems()` logic in `/components/app-sidebar.tsx`

### Client Can Access Admin Routes Directly

**Issue:** Middleware not blocking routes

**Solution:**

1. Check `/middleware.ts` has correct `roleRoutes` configuration
2. Verify middleware `matcher` config includes the route
3. Check session contains correct role: `/api/auth/me`

### After Login, Redirected to Wrong Page

**Issue:** Login redirect logic incorrect

**Solution:** Check `/components/login-form.tsx`:

```typescript
if (data.role === "admin") {
  router.push("/");
} else if (data.role === "client1") {
  router.push("/client1");
} else if (data.role === "client2") {
  router.push("/client2");
}
```

### Sidebar Shows "Loading..." Forever

**Issue:** User data not fetching

**Solution:**

1. Check browser console for errors
2. Verify `/api/auth/me` endpoint is working
3. Check session is valid (not expired)

---

## 🎯 Key Files

```
middleware.ts                        # Route protection & RBAC logic
components/app-sidebar.tsx           # Dynamic sidebar filtering
components/sidebar-wrapper.tsx       # Fetches user role
app/(protected)/unauthorized/page.tsx  # Access denied page
components/login-form.tsx            # Role-based redirect after login
```

---

## ✨ Features Summary

| Feature                   | Status | How It Works                                       |
| ------------------------- | ------ | -------------------------------------------------- |
| Admin Full Access         | ✅     | Sees all navigation items, can access all routes   |
| Client1 Limited Access    | ✅     | Sees only Client 1 + Settings, blocked from others |
| Client2 Limited Access    | ✅     | Sees only Client 2 + Settings, blocked from others |
| Route Protection          | ✅     | Middleware checks permissions before loading page  |
| Dynamic Sidebar           | ✅     | Navigation items filtered by role                  |
| Access Denied Page        | ✅     | Beautiful error page when trying forbidden routes  |
| Auto-Redirect on Login    | ✅     | Each role goes to their default page               |
| Manual URL Access Blocked | ✅     | Typing URL manually also triggers RBAC check       |

---

## 🎉 Benefits

1. **Security:** Users cannot access pages they shouldn't see
2. **Clean UI:** Users only see relevant navigation items
3. **User Experience:** No confusion - only see what you can use
4. **Maintainable:** Easy to add new roles or change permissions
5. **Foolproof:** Works even if user manually types URLs

---

**Your application now has enterprise-grade role-based access control!** 🔒

Admins have full control, while Client1 and Client2 users are restricted to their respective portals + settings, with beautiful error messages if they try to access forbidden areas.
