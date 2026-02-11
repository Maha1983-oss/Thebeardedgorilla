# Authentication Cache Fix

## Problems Fixed

### Problem 1: Stale User Data After Login/Logout

When logging out and logging in as a different user, the dashboard/sidebar would show the **previous user's data** for a few seconds until the page was refreshed or navigated away.

### Problem 2: Wrong Permissions During Page Loading

When navigating to the `/account` page (or any page) while logged in as client1 or client2, the sidebar would **briefly show admin menu items** during the loading phase.

### Root Causes

#### Issue 1: Module-Level Cache Never Cleared

The `sidebar-wrapper.tsx` component had a **module-level cache** that persisted user data across navigations:

```typescript
// Module-level cache persists across navigations (in the same tab)
let cachedUser: SessionUser | null = null;
```

**This cache was never cleared on logout!** So when a new user logged in, the old user's data was still displayed until the component refetched from the API.

#### Issue 2: Placeholder User Had Admin Role

The `PLACEHOLDER_USER` used during loading had `role: "admin"` hardcoded:

```typescript
const PLACEHOLDER_USER: SessionUser = {
  id: "",
  name: "Loading…",
  email: "",
  role: "admin", // ❌ Always showed admin permissions during loading!
};
```

When the page was loading (or navigating), the sidebar would use this placeholder and filter menu items as if the user was an admin, briefly showing all menu items even for client1/client2 users.

---

## Solution

### 1. **Created Centralized User Session Hook** (`lib/hooks/use-user.ts`)

- Uses React Query to manage user session state
- Automatically caches user data for 5 minutes
- Provides a `useLogout()` hook that clears ALL caches on logout

```typescript
export function useUser() {
  return useQuery<SessionUser>({
    queryKey: ["user-session"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error("Unauthorized");
      return await response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear(); // Clear ALL caches
    window.location.href = "/login";
  };
}
```

### 2. **Updated Components to Use Centralized Hook**

#### `components/sidebar-wrapper.tsx`

**Before:** Module-level cache + manual fetch

```typescript
let cachedUser: SessionUser | null = null;

export function SidebarWrapper(props: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<SessionUser | null>(cachedUser);

  React.useEffect(() => {
    if (cachedUser) return; // Never refreshes!

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        cachedUser = data;
        setUser(cachedUser);
      });
  }, []);

  return <AppSidebar user={user ?? PLACEHOLDER_USER} {...props} />;
}
```

**After:** React Query hook + loading state handling

```typescript
export function SidebarWrapper(props: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading } = useUser();

  // Pass loading state to prevent showing wrong permissions
  return <AppSidebar user={user} isLoading={isLoading} {...props} />;
}
```

**Key changes:**

- ✅ Removed module-level cache completely
- ✅ Removed PLACEHOLDER_USER with hardcoded admin role
- ✅ Pass `isLoading` state to AppSidebar
- ✅ Pass `user` directly (can be undefined during loading)

#### `components/app-sidebar.tsx`

**Added loading state handling:**

```typescript
export function AppSidebar({
  user,
  isLoading = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar?: string; role?: string };
  isLoading?: boolean;
}) {
  // Use placeholder for display purposes only (name/email)
  const displayUser = user ?? {
    name: "Loading…",
    email: "",
    avatar: undefined,
  };

  // Filter navigation items based on user role
  // IMPORTANT: Don't show any items while loading
  const getFilteredNavItems = () => {
    // If loading or no user data, show nothing
    if (isLoading || !user || !user.role) {
      return []; // ← Prevents showing wrong permissions!
    }

    // Rest of the filtering logic based on actual user role...
  };
}
```

**Key changes:**

- ✅ Accept `user` as optional (can be undefined)
- ✅ Accept `isLoading` boolean prop
- ✅ Use `displayUser` for showing name/email during loading
- ✅ Return empty array from `getFilteredNavItems()` when loading
- ✅ This prevents showing ANY menu items until user role is confirmed

#### `components/nav-user.tsx`

**Before:** Manual logout without cache clearing

```typescript
const handleLogout = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  router.push("/login");
  router.refresh();
};
```

**After:** Centralized logout that clears all caches

```typescript
const logout = useLogout();

const handleLogout = async () => {
  await logout(); // Clears ALL caches + redirects
};
```

#### `app/(protected)/page.tsx` (Admin Dashboard)

**Before:** Manual state management + fetch

```typescript
const [session, setSession] = useState<any>(null);

useEffect(() => {
  fetch("/api/auth/me")
    .then((res) => res.json())
    .then((data) => setSession(data));
}, []);
```

**After:** React Query hook

```typescript
const { data: session, isLoading: isLoadingUser } = useUser();

useEffect(() => {
  if (!isLoadingUser && session && session.role !== "admin") {
    router.push("/unauthorized");
  }
}, [session, isLoadingUser, router]);
```

#### `app/(protected)/account/page.tsx`

**Before:** Manual fetch + router refresh

```typescript
const [userData, setUserData] = useState<UserData | null>(null);

const fetchUserData = async () => {
  const response = await fetch("/api/auth/me");
  const data = await response.json();
  setUserData(data);
};

// After profile update
await fetchUserData();
router.refresh();
```

**After:** React Query hook + cache invalidation

```typescript
const { data: userData, isLoading: loading } = useUser();
const queryClient = useQueryClient();

// After profile update
await queryClient.invalidateQueries({ queryKey: ["user-session"] });
```

---

## Benefits

### ✅ **Immediate User Data Refresh on Logout**

When you log out and log in as a different user, the new user's data is displayed **immediately** because:

1. Logout clears the React Query cache
2. New login fetches fresh user data
3. All components using `useUser()` automatically update

### ✅ **Consistent State Across Components**

All components now use the same cached user data from React Query:

- Sidebar
- Navigation menu
- Dashboard
- Account page

### ✅ **No More Stale User Data**

The module-level cache that caused the bug is **completely removed**.

### ✅ **Automatic Cache Management**

React Query handles:

- Caching for 5 minutes
- Automatic refetching when data is stale
- Cache invalidation on logout
- Deduplication of requests

---

## Testing

### Test Scenario 1: Admin → Client Login

1. Login as **admin** → See admin dashboard and role badge ✅
2. Logout
3. Login as **client1** → Should **immediately** see client role badge ✅
4. No more seeing "admin" badge for a few seconds ✅

### Test Scenario 2: Client → Admin Login

1. Login as **client1** → See limited menu items ✅
2. Logout
3. Login as **admin** → Should **immediately** see full admin menu ✅
4. No more seeing client menu for a few seconds ✅

### Test Scenario 3: Profile Update

1. Update profile name/email
2. Changes **immediately** reflect in sidebar ✅
3. No need to refresh page ✅

### Test Scenario 4: No Permission Flash During Navigation (NEW FIX)

1. Login as **client2** ✅
2. Navigate to `/account` page ✅
3. During loading, sidebar should show **NO menu items** (or only client2 items) ✅
4. Should **NOT** briefly show admin menu items during loading ✅
5. After loading completes, correct menu items appear ✅

---

## Files Changed

1. **Created:**

   - `lib/hooks/use-user.ts` - Centralized user session management

2. **Modified:**
   - `components/sidebar-wrapper.tsx` - Removed module cache, use React Query
   - `components/nav-user.tsx` - Use centralized logout
   - `app/(protected)/page.tsx` - Use `useUser()` hook
   - `app/(protected)/account/page.tsx` - Use `useUser()` hook + cache invalidation

---

## Next Steps (Optional Enhancements)

1. **Add Session Refresh on Tab Focus** (currently disabled)

   ```typescript
   refetchOnWindowFocus: true; // Re-validate session when tab regains focus
   ```

2. **Add Optimistic Updates** for profile changes

   ```typescript
   queryClient.setQueryData(["user-session"], newUserData);
   ```

3. **Add Session Expiration Handling**
   - Automatically logout when session expires (401 response)
   - Show toast notification before auto-logout

---

## Summary

### Problems Fixed

1. **Stale User Data After Login/Logout:** Module-level cache in `sidebar-wrapper.tsx` was never cleared, causing old user's data to persist after switching accounts.

2. **Wrong Permissions During Loading:** PLACEHOLDER_USER had hardcoded `role: "admin"`, causing sidebar to briefly show admin menu items for all users during page loading.

### Solutions Implemented

1. **Replaced manual caching** with React Query's centralized cache management + proper cache clearing on logout.

2. **Added loading state handling** to AppSidebar to prevent showing any menu items until user role is confirmed.

### Results

✅ User data updates **immediately** when switching between accounts, no more stale data!

✅ Sidebar **never shows wrong permissions** during loading, even for a split second!

✅ All components use consistent, centralized user session state!

🎉 **Complete authentication UX fix!**
