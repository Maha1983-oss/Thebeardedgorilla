import { db } from "./index";
import { users, roles } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Create default roles
    console.log("Creating default roles...");
    const defaultRoles = [
      {
        name: "admin",
        description: "Full access to all features and settings",
      },
      {
        name: "client1",
        description: "Access to Client 1 portal and features",
      },
      {
        name: "client2",
        description: "Access to Client 2 portal and features",
      },
    ];

    for (const role of defaultRoles) {
      try {
        await db.insert(roles).values(role);
        console.log(`✅ Created role: ${role.name}`);
      } catch (error) {
        console.log(`⚠️  Role '${role.name}' might already exist, skipping...`);
      }
    }

    // Create default admin user
    console.log("\nCreating default admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    try {
      const adminUser = await db
        .insert(users)
        .values({
          name: "Admin User",
          email: "admin@example.com",
          password: hashedPassword,
          role: "admin",
          gender: "prefer_not_to_say",
          phone: "+1234567890",
          address: "123 Admin Street",
          isVerified: true,
        })
        .returning();

      console.log(`✅ Created admin user: ${adminUser[0].email}`);
      console.log(`   Password: admin123`);
      console.log(`   ⚠️  IMPORTANT: Change this password after first login!`);
    } catch (error) {
      console.log("⚠️  Admin user might already exist, skipping...");
    }

    // Create sample users
    console.log("\nCreating sample users...");
    const sampleUsers = [
      {
        name: "Client 1 User",
        email: "client1@example.com",
        password: await bcrypt.hash("client123", 10),
        role: "client1",
        gender: "male" as const,
        phone: "+1234567891",
        isVerified: true,
      },
      {
        name: "Client 2 User",
        email: "client2@example.com",
        password: await bcrypt.hash("client123", 10),
        role: "client2",
        gender: "female" as const,
        phone: "+1234567892",
        isVerified: true,
      },
    ];

    for (const user of sampleUsers) {
      try {
        await db.insert(users).values(user);
        console.log(`✅ Created user: ${user.email} (password: client123)`);
      } catch (error) {
        console.log(
          `⚠️  User '${user.email}' might already exist, skipping...`
        );
      }
    }

    console.log("\n✨ Database seeding completed!");
    console.log("\n📋 Default Credentials:");
    console.log("   Admin:   admin@example.com / admin123");
    console.log("   Client1: client1@example.com / client123");
    console.log("   Client2: client2@example.com / client123");
    console.log("\n⚠️  Remember to change these passwords in production!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("\n✅ Seed script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed script failed:", error);
    process.exit(1);
  });
