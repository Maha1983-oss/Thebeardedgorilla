import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for gender
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

// Users table
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  gender: genderEnum("gender"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Roles table (for role management)
export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CSV Uploads table (for storing uploaded CSV data)
export const csvUploads = pgTable("csv_uploads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fileType: varchar("file_type", { length: 50 }).notNull(), // 'shopify', 'tiktok', 'subscription', 'pl_client1', 'pl_client2', 'sgd_transactions', 'usd_transactions'
  data: json("data").notNull(), // Store processed CSV data as JSON
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Client2 Cashflow Transactions table
export const cashflowTransactions = pgTable("cashflow_transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  date: varchar("date", { length: 50 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'inflow' or 'outflow'
  amount: varchar("amount", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Client2 Pipeline Deals table
export const pipelineDeals = pgTable("pipeline_deals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  dealName: varchar("deal_name", { length: 255 }).notNull(),
  dealValue: varchar("deal_value", { length: 50 }).notNull(),
  stage: varchar("stage", { length: 50 }).notNull(),
  probability: varchar("probability", { length: 10 }).notNull(),
  expectedCloseDate: varchar("expected_close_date", { length: 50 }),
  revenueBreakdown: json("revenue_breakdown"), // Array of {month, year, amount}
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Client2 Projects table
export const projects = pgTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  date: varchar("date", { length: 50 }).notNull(),
  clientProject: varchar("client_project", { length: 255 }).notNull(),
  projectNumber: varchar("project_number", { length: 100 }),
  valueQuoted: varchar("value_quoted", { length: 50 }),
  quotedCurrency: varchar("quoted_currency", { length: 10 })
    .notNull()
    .default("USD"),
  valueSGD: varchar("value_sgd", { length: 50 }),
  numberOfStudies: varchar("number_of_studies", { length: 50 }),
  purchaseOrder: varchar("purchase_order", { length: 255 }),
  fieldWorkStatus: varchar("field_work_status", { length: 50 })
    .notNull()
    .default("Not Started"),
  fieldWorkStartDate: varchar("field_work_start_date", { length: 50 }),
  fieldWorkEndDate: varchar("field_work_end_date", { length: 50 }),
  reportStatus: varchar("report_status", { length: 50 })
    .notNull()
    .default("Not Started"),
  invoiceStatus: varchar("invoice_status", { length: 50 })
    .notNull()
    .default("Not Issued"),
  invoiceDate: varchar("invoice_date", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Client2 Project Costs table
export const projectCosts = pgTable("project_costs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  monthYear: varchar("month_year", { length: 50 }).notNull(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  client: varchar("client", { length: 255 }),
  market: varchar("market", { length: 100 }),
  baseAmountUSD: varchar("base_amount_usd", { length: 50 }),
  dataUSD: varchar("data_usd", { length: 50 }),
  totalAmountUSD: varchar("total_amount_usd", { length: 50 }),
  baseAmountSGD: varchar("base_amount_sgd", { length: 50 }),
  dataSGD: varchar("data_sgd", { length: 50 }),
  totalAmountSGD: varchar("total_amount_sgd", { length: 50 }),
  projectRevenue: varchar("project_revenue", { length: 50 }),
  costPercentage: varchar("cost_percentage", { length: 10 }),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Client2 Settings table (for opening balance, EBITDA adjustments, classifications)
export const client2Settings = pgTable("client2_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  cashflowOpeningBalance: varchar("cashflow_opening_balance", { length: 50 })
    .notNull()
    .default("0"),
  ebitdaAdjustments: json("ebitda_adjustments"), // Object with monthly adjustments
  classifications: json("classifications"), // Object with classification mappings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Global Client2 Classifications table (admin-managed, applies to all client2 users)
export const globalClient2Classifications = pgTable(
  "global_client2_classifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    classifications: json("classifications").notNull(), // Object with classification mappings
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(1, "Password is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);

export const insertRoleSchema = createInsertSchema(roles, {
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectRoleSchema = createSelectSchema(roles);

export const insertCSVUploadSchema = createInsertSchema(csvUploads, {
  fileType: z.enum([
    "shopify",
    "tiktok",
    "subscription",
    "pl_client1",
    "pl_client2",
    "sgd_transactions",
    "usd_transactions",
  ]),
  data: z.any(),
}).omit({
  id: true,
  uploadedAt: true,
});

export const selectCSVUploadSchema = createSelectSchema(csvUploads);

// Client2 Zod schemas
export const insertCashflowTransactionSchema = createInsertSchema(
  cashflowTransactions
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPipelineDealSchema = createInsertSchema(pipelineDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectCostSchema = createInsertSchema(projectCosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClient2SettingsSchema = createInsertSchema(
  client2Settings
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalClient2ClassificationsSchema = createInsertSchema(
  globalClient2Classifications
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Role = typeof roles.$inferSelect;
export type NewRole = z.infer<typeof insertRoleSchema>;
export type CSVUpload = typeof csvUploads.$inferSelect;
export type NewCSVUpload = z.infer<typeof insertCSVUploadSchema>;

// Client2 Types
export type CashflowTransaction = typeof cashflowTransactions.$inferSelect;
export type NewCashflowTransaction = z.infer<
  typeof insertCashflowTransactionSchema
>;
export type PipelineDeal = typeof pipelineDeals.$inferSelect;
export type NewPipelineDeal = z.infer<typeof insertPipelineDealSchema>;
export type Project = typeof projects.$inferSelect;
export type NewProject = z.infer<typeof insertProjectSchema>;
export type ProjectCost = typeof projectCosts.$inferSelect;
export type NewProjectCost = z.infer<typeof insertProjectCostSchema>;
export type Client2Settings = typeof client2Settings.$inferSelect;
export type NewClient2Settings = z.infer<typeof insertClient2SettingsSchema>;
export type GlobalClient2Classifications =
  typeof globalClient2Classifications.$inferSelect;
export type NewGlobalClient2Classifications = z.infer<
  typeof insertGlobalClient2ClassificationsSchema
>;
