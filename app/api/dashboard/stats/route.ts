import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";

// Cached function to calculate dashboard stats
const getCachedDashboardStats = unstable_cache(
  async () => {
    // Get total user counts by role
    const allUsers = await db.select().from(users);

    const totalUsers = allUsers.length;
    const adminCount = allUsers.filter((u) => u.role === "admin").length;
    const client1Count = allUsers.filter((u) => u.role === "client1").length;
    const client2Count = allUsers.filter((u) => u.role === "client2").length;

    // Get user growth data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Group users by creation date
    const userGrowthData = allUsers
      .filter((u) => new Date(u.createdAt) >= thirtyDaysAgo)
      .reduce((acc: Record<string, number>, user) => {
        const date = new Date(user.createdAt).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    // Create cumulative growth data
    let cumulative =
      totalUsers -
      allUsers.filter((u) => new Date(u.createdAt) >= thirtyDaysAgo).length;

    const growthChart = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split("T")[0];

      cumulative += userGrowthData[dateStr] || 0;

      growthChart.push({
        date: dateStr,
        users: cumulative,
        newUsers: userGrowthData[dateStr] || 0,
      });
    }

    return {
      counts: {
        total: totalUsers,
        admin: adminCount,
        client1: client1Count,
        client2: client2Count,
      },
      growthChart,
    };
  },
  ["dashboard-stats"],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ["users", "dashboard"],
  }
);

// GET - Fetch dashboard statistics
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin to access dashboard stats
    if (session.role !== "admin") {
      return NextResponse.json(
        {
          error: "Access denied. Only admins can access dashboard statistics.",
        },
        { status: 403 }
      );
    }

    const stats = await getCachedDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
