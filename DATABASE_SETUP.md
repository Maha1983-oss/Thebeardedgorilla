# Database Setup Guide

This guide will help you set up PostgreSQL and Drizzle ORM for the user management system.

## Prerequisites

- PostgreSQL installed on your machine
- Node.js and npm installed

## Step 1: Install PostgreSQL

### macOS (using Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows

Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

## Step 2: Create Database

1. Access PostgreSQL:

```bash
psql -U postgres
```

2. Create the database:

```sql
CREATE DATABASE mahadevan_db;
```

3. Exit PostgreSQL:

```sql
\q
```

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# PostgreSQL Database URL
# Format: postgresql://username:password@localhost:5432/database_name
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mahadevan_db

# Next Auth (if needed later)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
```

**Important:** Update the `DATABASE_URL` with your actual PostgreSQL credentials:

- Replace `postgres` (first one) with your PostgreSQL username
- Replace `postgres` (second one) with your PostgreSQL password
- Replace `mahadevan_db` if you used a different database name

## Step 4: Push Schema to Database

Run the following command to create all tables in your database:

```bash
npm run db:push
```

This will:

- Create the `users` table with all fields (id, name, email, password, role, gender, phone, address, isVerified, createdAt, updatedAt)
- Create the `roles` table for custom role management
- Create the necessary enums (role, gender)

## Step 5: (Optional) Generate Migrations

If you want to track schema changes with migrations:

```bash
npm run db:generate
npm run db:migrate
```

## Step 6: (Optional) Use Drizzle Studio

To visually browse and edit your database:

```bash
npm run db:studio
```

This will open Drizzle Studio in your browser at `http://localhost:4983`

## Database Schema

### Users Table

- **id**: UUID (Primary Key)
- **name**: VARCHAR(255) - User's full name
- **email**: VARCHAR(255) - Unique email address
- **password**: VARCHAR(255) - Hashed password (bcrypt)
- **role**: ENUM('admin', 'client1', 'client2') - User role
- **gender**: ENUM('male', 'female', 'other', 'prefer_not_to_say') - Optional
- **phone**: VARCHAR(20) - Optional phone number
- **address**: TEXT - Optional address
- **isVerified**: BOOLEAN - Email verification status
- **createdAt**: TIMESTAMP - Auto-generated
- **updatedAt**: TIMESTAMP - Auto-updated

### Roles Table

- **id**: UUID (Primary Key)
- **name**: VARCHAR(50) - Unique role name
- **description**: TEXT - Optional role description
- **createdAt**: TIMESTAMP - Auto-generated
- **updatedAt**: TIMESTAMP - Auto-updated

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/[id]` - Get single user
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Roles

- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create a new role
- `GET /api/roles/[id]` - Get single role
- `PATCH /api/roles/[id]` - Update role
- `DELETE /api/roles/[id]` - Delete role

## Pages

- `/dashboard/users` - User management page (view, add, edit, delete users)
- `/dashboard/users/roles` - Role management page (view, add, edit, delete roles)

## Troubleshooting

### Connection Error

If you get a connection error, check:

1. PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
2. Database exists: `psql -U postgres -l`
3. Credentials in `.env.local` are correct

### Migration Issues

If you have migration issues:

```bash
# Reset and push fresh schema
npm run db:push
```

### View Database

```bash
# Connect to database
psql -U postgres -d mahadevan_db

# List tables
\dt

# View users table
SELECT * FROM users;

# View roles table
SELECT * FROM roles;
```

## Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Change default passwords** - Update PostgreSQL password and NEXTAUTH_SECRET
3. **Use strong passwords** - Enforce minimum 6 characters (configured in schema)
4. **Hash passwords** - Automatically done with bcrypt in the API routes
5. **Validate input** - Using Zod schemas for validation

## Next Steps

After setup:

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/dashboard/users`
3. Create your first admin user
4. Manage users and roles through the UI

Enjoy your user management system! 🎉
