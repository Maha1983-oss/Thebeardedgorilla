import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

// Lazy initialization - only connect when db is actually used
// This allows the module to be imported during build without requiring DATABASE_URL
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. " +
      "For local development: Create a .env.local file with DATABASE_URL. " +
      "For Vercel deployments: Set DATABASE_URL in your project's environment variables."
    );
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL);
  }

  if (!dbInstance) {
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance;
}

// Export db as a Proxy that lazily initializes only when accessed
// This prevents errors during build-time module analysis
// The database will only connect when actually used (at runtime)
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const db = getDb();
    const value = db[prop as keyof ReturnType<typeof drizzle>];
    // If it's a function, bind it to maintain 'this' context
    if (typeof value === "function") {
      return value.bind(db);
    }
    return value;
  },
});
