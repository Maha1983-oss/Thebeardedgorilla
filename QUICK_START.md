# Quick Start Guide - User Management System

Follow these steps to get your user management system up and running!

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd my-app
npm install
```

### Step 2: Setup PostgreSQL

**Option A - Using existing PostgreSQL:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mahadevan_db;

# Exit
\q
```

**Option B - Install PostgreSQL (if not installed):**

- **macOS:** `brew install postgresql@16 && brew services start postgresql@16`
- **Ubuntu:** `sudo apt install postgresql && sudo systemctl start postgresql`
- **Windows:** Download from https://www.postgresql.org/download/windows/

### Step 3: Configure Environment

Create `.env.local` in the project root:

```bash
echo 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mahadevan_db' > .env.local
```

**⚠️ Important:** Update the credentials if your PostgreSQL has different username/password!

### Step 4: Initialize Database

```bash
# Push schema to database (creates all tables)
npm run db:push

# Seed with sample data (optional but recommended)
npm run db:seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

## 🎉 You're Done!

Open your browser and visit:

### User Management

**URL:** http://localhost:3000/dashboard/users

**Features:**

- ✅ View all users in a table
- ✅ Add new users with form validation
- ✅ Edit existing users
- ✅ Delete users with confirmation
- ✅ Search/filter users
- ✅ User properties: name, email, password, role, gender, phone, address, verification status

### Role Management

**URL:** http://localhost:3000/dashboard/users/roles

**Features:**

- ✅ View all roles
- ✅ Create custom roles
- ✅ Edit role details
- ✅ Delete roles
- ✅ Search/filter roles

## 🔑 Default Credentials (if you ran db:seed)

After seeding, you can test with these accounts:

| Email               | Password  | Role     |
| ------------------- | --------- | -------- |
| admin@example.com   | admin123  | Admin    |
| client1@example.com | client123 | Client 1 |
| client2@example.com | client123 | Client 2 |

**⚠️ Change these passwords immediately in production!**

## 🛠️ Useful Commands

```bash
# Database
npm run db:push      # Update database schema
npm run db:studio    # Open visual database browser
npm run db:seed      # Add sample data

# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check for errors
```

## 🐛 Troubleshooting

### "Connection refused" error

- Check if PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Verify DATABASE_URL in `.env.local` has correct credentials

### "Database does not exist" error

- Create the database: `psql -U postgres -c "CREATE DATABASE mahadevan_db;"`

### Cannot connect to PostgreSQL

- Reset password: `psql -U postgres` (if it fails, you may need to configure pg_hba.conf)
- On macOS with Homebrew: `psql postgres` (no password needed by default)

### Tables not created

- Run: `npm run db:push` again
- Check console for errors
- Verify DATABASE_URL is correct

## 📚 Next Steps

1. **Customize the UI** - Edit components in `/app/dashboard/users/page.tsx`
2. **Add more fields** - Update schema in `/lib/db/schema.ts`
3. **Add authentication** - Integrate with NextAuth.js
4. **Add permissions** - Implement role-based access control
5. **Add email verification** - Integrate with email service

## 🎯 Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── users/          # User CRUD endpoints
│   │   └── roles/          # Roles CRUD endpoints
│   └── dashboard/
│       └── users/
│           ├── page.tsx    # User management UI
│           └── roles/
│               └── page.tsx # Role management UI
├── lib/
│   └── db/
│       ├── schema.ts       # Database schema
│       ├── index.ts        # Database connection
│       └── seed.ts         # Sample data
├── components/
│   └── ui/                 # Shadcn UI components
└── drizzle.config.ts       # Drizzle configuration
```

Need help? Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions!
