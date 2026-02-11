CREATE TABLE "cashflow_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client2_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cashflow_opening_balance" varchar(50) DEFAULT '0' NOT NULL,
	"ebitda_adjustments" json,
	"classifications" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client2_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "csv_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"data" json NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_client2_classifications" (
	"id" text PRIMARY KEY NOT NULL,
	"classifications" json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_deals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"deal_name" varchar(255) NOT NULL,
	"deal_value" varchar(50) NOT NULL,
	"stage" varchar(50) NOT NULL,
	"probability" varchar(10) NOT NULL,
	"expected_close_date" varchar(50),
	"revenue_breakdown" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_costs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"month_year" varchar(50) NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"client" varchar(255),
	"market" varchar(100),
	"base_amount_usd" varchar(50),
	"data_usd" varchar(50),
	"total_amount_usd" varchar(50),
	"base_amount_sgd" varchar(50),
	"data_sgd" varchar(50),
	"total_amount_sgd" varchar(50),
	"project_revenue" varchar(50),
	"cost_percentage" varchar(10),
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" varchar(50) NOT NULL,
	"client_project" varchar(255) NOT NULL,
	"project_number" varchar(100),
	"value_quoted" varchar(50),
	"quoted_currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"value_sgd" varchar(50),
	"number_of_studies" varchar(50),
	"purchase_order" varchar(255),
	"field_work_status" varchar(50) DEFAULT 'Not Started' NOT NULL,
	"field_work_start_date" varchar(50),
	"field_work_end_date" varchar(50),
	"report_status" varchar(50) DEFAULT 'Not Started' NOT NULL,
	"invoice_status" varchar(50) DEFAULT 'Not Issued' NOT NULL,
	"invoice_date" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "cashflow_transactions" ADD CONSTRAINT "cashflow_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client2_settings" ADD CONSTRAINT "client2_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_uploads" ADD CONSTRAINT "csv_uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "global_client2_classifications" ADD CONSTRAINT "global_client2_classifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_deals" ADD CONSTRAINT "pipeline_deals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_costs" ADD CONSTRAINT "project_costs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."role";