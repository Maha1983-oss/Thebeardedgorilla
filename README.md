This is a [Next.js](https://nextjs.org) project with user management, built with Drizzle ORM and PostgreSQL.

## Features

- 🔐 **User Management** - Complete CRUD operations for users
- 👥 **Role Management** - Manage custom roles and permissions
- 🛡️ **Role-Based Access Control** - Different permissions for Admin, Client1, Client2
- 🎨 **Modern UI** - Built with Shadcn UI components
- 📊 **Dashboard** - Beautiful sidebar navigation with analytics, client portals
- 🔒 **Secure** - Password hashing with bcrypt, input validation with Zod
- 💾 **Database** - PostgreSQL with Drizzle ORM
- 🚪 **Authentication** - JWT sessions, login/logout, protected routes

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- PostgreSQL installed and running
- npm or yarn package manager

## Database Setup

**Important:** You must set up the database before running the application.

1. **Create `.env.local` file** in the project root:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mahadevan_db
```

Update with your PostgreSQL credentials.

2. **Create the database:**

```bash
psql -U postgres
CREATE DATABASE mahadevan_db;
\q
```

3. **Push schema to database:**

```bash
npm run db:push
```

📖 For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md)

## Getting Started

After database setup, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Routes

### Public Routes

- `/login` - Login page
- `/signup` - Signup page

### Protected Routes

- `/` - Analytics Dashboard (🔒 **Admin only**)
- `/client1` - Client 1 portal (Order Unifier) (🔒 **Admin & Client1**)
- `/client2` - Client 2 portal (P&L Dashboard) (🔒 **Admin & Client2**)
- `/users` - **User Management** (🔒 **Admin only**)
- `/users/roles` - **Role Management** (🔒 **Admin only**)
- `/account` - **Account Settings** (🔒 All authenticated users)
- `/setting` - General Settings (🔒 All authenticated users)
- `/unauthorized` - Access denied page

> **Note:** See [ROUTE_MIGRATION.md](./ROUTE_MIGRATION.md) for details on recent route simplification.

## Database Scripts

```bash
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio (visual database browser)
```

## API Endpoints

### Users API

- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Roles API

- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `GET /api/roles/[id]` - Get role
- `PATCH /api/roles/[id]` - Update role
- `DELETE /api/roles/[id]` - Delete role

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **UI:** Shadcn UI + Tailwind CSS
- **Validation:** Zod
- **Authentication:** bcryptjs (password hashing)
- **Icons:** Lucide React

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
