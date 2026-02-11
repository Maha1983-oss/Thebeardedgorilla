/**
 * Apply database indexes for performance optimization
 * Run this script to add indexes to your database
 *
 * Usage: npx tsx scripts/apply-indexes.ts
 */

import { db } from "../lib/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function applyIndexes() {
  try {
    console.log("🚀 Applying performance indexes...\n");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "../lib/db/migrations/add-performance-indexes.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log("✅ Performance indexes applied successfully!\n");
    console.log("Indexes created:");
    console.log("  - idx_users_email (users.email)");
    console.log("  - idx_users_role (users.role)");
    console.log("  - idx_users_created_at (users.created_at)");
    console.log("  - idx_csv_uploads_file_type (csv_uploads.file_type)");
    console.log("  - idx_csv_uploads_is_active (csv_uploads.is_active)");
    console.log(
      "  - idx_csv_uploads_file_type_active (csv_uploads.file_type, is_active)"
    );
    console.log("  - idx_roles_name (roles.name)");
    console.log("\n✨ Database performance optimized!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error applying indexes:", error);
    process.exit(1);
  }
}

applyIndexes();
