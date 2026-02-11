# 🚀 Setup Checklist - User Management System

Follow this checklist to get your system running in 5 minutes!

## ☑️ Pre-Setup

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Terminal/Command Prompt open
- [ ] Code editor ready (VS Code recommended)

## ☑️ Step-by-Step Setup

### 1. Install Dependencies

```bash
cd my-app
npm install
```

**Expected:** Should complete without errors, ~445 packages

---

### 2. Create Environment File

Create `.env.local` file in `my-app/` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mahadevan_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
```

- [ ] File created
- [ ] Update `postgres:postgres` with your actual username:password
- [ ] Save the file

---

### 3. Create PostgreSQL Database

**Option A - Command Line:**

```bash
psql -U postgres
CREATE DATABASE mahadevan_db;
\q
```

**Option B - pgAdmin:**

- Open pgAdmin
- Right-click Databases → Create → Database
- Name: `mahadevan_db`
- Click Save

- [ ] Database created successfully

---

### 4. Initialize Database Schema

```bash
npm run db:push
```

**Expected Output:**

```
✓ Applying changes
✓ Done!
```

- [ ] Command ran successfully
- [ ] No errors shown

---

### 5. Add Sample Data (Optional but Recommended)

```bash
npm run db:seed
```

**Expected Output:**

```
✅ Created admin user: admin@example.com
   Password: admin123
✅ Created user: client1@example.com
✅ Created user: client2@example.com
✨ Database seeding completed!
```

- [ ] Seed completed successfully
- [ ] Note down the credentials

---

### 6. Start Development Server

```bash
npm run dev
```

**Expected Output:**

```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
✓ Ready in X.Xs
```

- [ ] Server started
- [ ] No compilation errors
- [ ] Port 3000 is accessible

---

## ☑️ Verification

Open your browser and test these URLs:

### Test 1: Main Dashboard

- [ ] Visit: http://localhost:3000/dashboard
- [ ] Page loads without errors
- [ ] Sidebar is visible
- [ ] Can toggle sidebar

### Test 2: User Management

- [ ] Visit: http://localhost:3000/dashboard/users
- [ ] See "User Management" heading
- [ ] Table loads (shows users if you ran seed)
- [ ] "Add User" button is visible

### Test 3: Add New User

- [ ] Click "Add User" button
- [ ] Form dialog opens
- [ ] Fill in required fields:
  - Name: Test User
  - Email: test@example.com
  - Password: test123
  - Role: Select any
- [ ] Click "Create User"
- [ ] User appears in table
- [ ] Success! ✨

### Test 4: Edit User

- [ ] Click pencil icon on any user
- [ ] Form opens with user data pre-filled
- [ ] Change the name
- [ ] Click "Update User"
- [ ] Name updates in table
- [ ] Success! ✨

### Test 5: Search Users

- [ ] Type in search box
- [ ] Table filters in real-time
- [ ] Success! ✨

### Test 6: Role Management

- [ ] Click "User Management" in sidebar
- [ ] Click "Roles" sub-menu
- [ ] OR visit: http://localhost:3000/dashboard/users/roles
- [ ] See roles table
- [ ] Click "Add Role"
- [ ] Create a test role
- [ ] Success! ✨

### Test 7: Delete Confirmation

- [ ] Click trash icon on a user
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" - nothing happens
- [ ] Click trash again
- [ ] Click "Delete" - user removed
- [ ] Success! ✨

---

## ☑️ Bonus: Database Browser

Want to see your data visually?

```bash
npm run db:studio
```

- [ ] Visit: http://localhost:4983
- [ ] See users table
- [ ] See roles table
- [ ] Explore data

---

## 🎉 Completion

If all checkboxes are checked, you're ready to go!

### What You Have Now:

✅ Full user CRUD (Create, Read, Update, Delete)
✅ Role management system  
✅ Beautiful, responsive UI
✅ Form validation
✅ Search/filter functionality
✅ Password hashing security
✅ PostgreSQL database
✅ REST API endpoints
✅ TypeScript type safety

---

## 📚 Next Actions

Choose your path:

### For Learning:

- [ ] Read `USER_MANAGEMENT_SUMMARY.md` - Complete feature overview
- [ ] Read `DATABASE_SETUP.md` - Deep dive into database
- [ ] Explore the code in VS Code
- [ ] Try modifying the UI
- [ ] Add a new user field

### For Development:

- [ ] Add authentication (NextAuth.js)
- [ ] Add email verification
- [ ] Add role-based permissions
- [ ] Add pagination to tables
- [ ] Add data export (CSV)
- [ ] Add profile pictures
- [ ] Add activity logs

### For Production:

- [ ] Change all default passwords
- [ ] Update environment variables
- [ ] Add proper error handling
- [ ] Add logging (Sentry, etc.)
- [ ] Set up CI/CD
- [ ] Configure production database
- [ ] Add rate limiting
- [ ] Enable HTTPS

---

## 🆘 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

- Check PostgreSQL is running: `brew services list` (macOS)
- Start PostgreSQL: `brew services start postgresql@16`
- Verify credentials in `.env.local`

### Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution:**

- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or use different port: `npm run dev -- -p 3001`

### Module Not Found

```
Error: Cannot find module 'drizzle-orm'
```

**Solution:**

- Re-install: `rm -rf node_modules package-lock.json && npm install`

### Database Schema Out of Sync

```
Error: relation "users" does not exist
```

**Solution:**

- Run: `npm run db:push` again

---

## ✅ Final Check

Everything working?

- [ ] ✅ Users page loads
- [ ] ✅ Can create users
- [ ] ✅ Can edit users
- [ ] ✅ Can delete users
- [ ] ✅ Roles page works
- [ ] ✅ Search works
- [ ] ✅ No console errors

**Congratulations! Your user management system is fully operational!** 🎊

---

**Need Help?**

- Check the documentation files
- Review error messages carefully
- Use `npm run db:studio` to inspect database
- Check browser console for errors (F12)
- Check terminal for API errors

**Happy coding!** 💻
