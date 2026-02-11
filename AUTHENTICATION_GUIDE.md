# Authentication System - Complete Guide

## ✅ What Has Been Implemented

### 1. **Full Authentication System**

#### Session Management

- JWT-based authentication using `jose` library
- HTTP-only cookies for secure session storage
- 24-hour session expiration
- Automatic session refresh

#### API Endpoints

- `POST /api/auth/login` - User login with email & password
- `POST /api/auth/logout` - Clear session and logout
- `GET /api/auth/me` - Get current user session

### 2. **Login & Logout Functionality**

#### Login Form

**Location:** `/components/login-form.tsx`

**Features:**

- ✅ Email and password authentication
- ✅ Password visibility toggle
- ✅ Error message display
- ✅ Loading states
- ✅ Form validation

**Flow:**

1. User enters email and password
2. Credentials sent to `/api/auth/login`
3. Server validates against database (bcrypt password verification)
4. Session created with JWT token
5. User redirected based on role:
   - **Admin** → `/`
   - **Client1** → `/client1`
   - **Client2** → `/client2`

#### Logout

**Trigger:** Click "Log out" in user dropdown menu

**Flow:**

1. Calls `/api/auth/logout`
2. Deletes session cookie
3. Redirects to `/login`

### 3. **Route Protection (Middleware)**

**Location:** `/middleware.ts`

**Protected Routes:**

- All protected routes - Require authentication

**Auto-Redirect:**

- Unauthenticated users → redirected to `/login`
- Authenticated users on `/login` → redirected to their dashboard

### 4. **Dynamic User Display**

#### Sidebar User Info

**Before:** Hardcoded "shadcn" and "m@example.com"  
**Now:** Shows actual logged-in user's name and email

**Implementation:**

- `SidebarWrapper` component fetches user data from `/api/auth/me`
- Displays real-time session data
- Shows user initials in avatar (auto-generated from name)
- Updates immediately after login

**Features:**

- ✅ User avatar with initials
- ✅ Full name display
- ✅ Email display
- ✅ Role badge (Admin/Client1/Client2)

### 5. **Account Management Page**

**URL:** http://localhost:3000/account  
**Access:** Click "Account" in user dropdown menu

**Features:**

#### Profile Overview Card

- User avatar with initials
- Full name and email
- Role badge (color-coded)
- Phone number (if available)
- Gender (if available)

#### Edit Profile Form

**Editable Fields:**

- ✅ Full Name \*
- ✅ Email \*
- ✅ Phone
- ✅ Gender (dropdown: Male, Female, Other, Prefer not to say)
- ✅ Address (textarea)

#### Change Password Section

- ✅ New Password field
- ✅ Confirm Password field
- ✅ Validation (min 6 characters, passwords must match)
- ✅ Optional - leave blank to keep current password

**Validations:**

- Required fields marked with \*
- Email format validation
- Password strength (minimum 6 characters)
- Password confirmation match
- Real-time error messages

**Success Flow:**

1. User edits their information
2. Clicks "Save Changes"
3. Data sent to `/api/users/{id}` (PATCH)
4. Password automatically hashed if changed
5. Success message displayed
6. Session refreshed
7. Sidebar updates with new info

### 6. **Security Features**

✅ **Password Hashing**

- bcrypt with 10 rounds
- Passwords never stored or transmitted in plain text

✅ **Secure Sessions**

- HTTP-only cookies
- SameSite: Lax
- Secure flag in production
- 24-hour expiration

✅ **Protected Routes**

- Middleware blocks unauthorized access
- Automatic redirects

✅ **Input Validation**

- Email format checking
- Password strength requirements
- Zod schemas on backend

✅ **CSRF Protection**

- SameSite cookies
- HTTP-only flag

## 📁 Files Created/Modified

### New Files

```
lib/auth.ts                          # Authentication utilities
app/api/auth/login/route.ts         # Login endpoint
app/api/auth/logout/route.ts        # Logout endpoint
app/api/auth/me/route.ts             # Get session endpoint
middleware.ts                        # Route protection
components/sidebar-wrapper.tsx       # Fetches user data
app/(protected)/account/page.tsx       # Account management page
```

### Modified Files

```
components/login-form.tsx            # Added login functionality
components/nav-user.tsx              # Added logout & account link
components/app-sidebar.tsx           # Dynamic user prop
app/(protected)/layout.tsx  # Protected routes layout with sidebar
components/site-header.tsx           # Add account breadcrumb
```

## 🔐 Default Test Accounts

After running `npm run db:seed`:

| Email               | Password  | Role     | Dashboard |
| ------------------- | --------- | -------- | --------- |
| admin@example.com   | admin123  | Admin    | /         |
| client1@example.com | client123 | Client 1 | /client1  |
| client2@example.com | client123 | Client 2 | /client2  |

⚠️ **Change these passwords in production!**

## 🚀 How to Use

### Step 1: Setup Database

```bash
# If not already done
npm run db:push
npm run db:seed
```

### Step 2: Start Server

```bash
npm run dev
```

### Step 3: Test Login

1. Visit http://localhost:3000/login
2. Enter credentials (e.g., admin@example.com / admin123)
3. Click "Login"
4. Redirected to dashboard

### Step 4: Test Account Management

1. After login, look at bottom of sidebar
2. See your name and email (instead of "shadcn")
3. Click on your name to open dropdown
4. Click "Account"
5. Edit your profile information
6. Click "Save Changes"
7. Check sidebar - info should update!

### Step 5: Test Logout

1. Click on your name in sidebar
2. Click "Log out"
3. Redirected to login page
4. Session cleared

## 🎯 User Flow Diagrams

### Login Flow

```
Login Page
    ↓
Enter Email & Password
    ↓
Submit Form
    ↓
POST /api/auth/login
    ↓
Validate Credentials (DB check + bcrypt)
    ↓
Create JWT Session
    ↓
Set HTTP-only Cookie
    ↓
Redirect Based on Role:
    - Admin → /
    - Client1 → /client1
    - Client2 → /client2
    ↓
Middleware Allows Access (authenticated)
    ↓
Dashboard Loads
    ↓
SidebarWrapper fetches user data
    ↓
Display User Name & Email in Sidebar
```

### Account Update Flow

```
Click "Account" in Dropdown
    ↓
Navigate to /account
    ↓
Page fetches user data from /api/auth/me
    ↓
Form pre-populated with user info
    ↓
User edits fields
    ↓
Click "Save Changes"
    ↓
Validation (frontend)
    ↓
PATCH /api/users/{id}
    ↓
Update Database
    ↓
Hash password if changed
    ↓
Success Response
    ↓
Show success message
    ↓
Refresh session
    ↓
Sidebar updates automatically
```

### Logout Flow

```
Click "Log out" in Dropdown
    ↓
POST /api/auth/logout
    ↓
Delete session cookie
    ↓
Redirect to /login
    ↓
Middleware blocks dashboard access
```

## 🛡️ Security Best Practices Implemented

1. ✅ Passwords hashed with bcrypt (never stored plain)
2. ✅ HTTP-only cookies (can't be accessed via JavaScript)
3. ✅ SameSite cookie protection
4. ✅ Secure flag in production
5. ✅ Session expiration (24 hours)
6. ✅ Middleware-based route protection
7. ✅ Input validation on frontend and backend
8. ✅ Error messages don't leak information
9. ✅ JWT signed with secret key
10. ✅ Database queries use ORM (SQL injection protection)

## 📝 Environment Variables

Add to `.env.local`:

```env
# Database (already set)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mahadevan_db

# JWT Secret (recommended to add)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Next.js (already set)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
```

⚠️ **Important:** Change `JWT_SECRET` in production to a strong random string!

## 🐛 Troubleshooting

### "Not authenticated" error

- Check if you're logged in
- Session may have expired (24 hours)
- Try logging in again

### Sidebar shows "Loading..."

- Network issue - check `/api/auth/me` endpoint
- Session may be invalid
- Clear cookies and login again

### Can't access dashboard

- Middleware redirecting - not logged in
- Check browser console for errors
- Verify database connection

### Changes not reflected in sidebar

- Hard refresh page (Cmd+Shift+R / Ctrl+Shift+F5)
- Clear browser cache
- Check if update was successful

## 🎨 Customization

### Change Session Duration

In `lib/auth.ts`:

```typescript
.setExpirationTime("24h")  // Change to "7d", "1h", etc.
```

### Add More Roles

1. Update schema in `lib/db/schema.ts`
2. Add role to enum: `["admin", "client1", "client2", "newrole"]`
3. Run `npm run db:push`
4. Update login routing in `components/login-form.tsx`

### Customize Account Page Fields

Edit `/app/(protected)/account/page.tsx`:

- Add new form fields
- Update formData state
- Include in API request

### Change Redirect Routes

In `components/login-form.tsx`:

```typescript
if (data.role === "admin") {
  router.push("/your-custom-route");
}
```

## ✨ Features Summary

| Feature              | Status | Location       |
| -------------------- | ------ | -------------- |
| Login                | ✅     | `/login`       |
| Logout               | ✅     | User dropdown  |
| Session Management   | ✅     | JWT + cookies  |
| Route Protection     | ✅     | Middleware     |
| Dynamic User Display | ✅     | Sidebar        |
| Account Management   | ✅     | `/account`     |
| Password Change      | ✅     | Account page   |
| Profile Edit         | ✅     | Account page   |
| Role-based Routing   | ✅     | Login redirect |
| Error Handling       | ✅     | All forms      |

---

**Your authentication system is now fully functional!** 🎉

Users can:

1. ✅ Login with their credentials
2. ✅ See their name/email in the sidebar (no more hardcoded data!)
3. ✅ Click "Account" to manage their profile
4. ✅ Edit name, email, phone, gender, address
5. ✅ Change their password securely
6. ✅ Logout safely

Admins are automatically routed to `/`, while Client1 and Client2 users will go to their respective portals (you can customize these pages later).
