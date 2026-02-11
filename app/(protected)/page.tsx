"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCog, Building2, Building } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isLoading: isLoadingUser } = useUser();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();

  useEffect(() => {
    // Redirect if not admin
    if (!isLoadingUser && session && session.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [session, isLoadingUser, router]);

  if (!session || isLoadingUser) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.counts.total || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Administrators",
      value: stats?.counts.admin || 0,
      icon: UserCog,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "LiquidPlus Users",
      value: stats?.counts.client1 || 0,
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "ADNA Research Users",
      value: stats?.counts.client2 || 0,
      icon: Building,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  // Format data for the chart
  const chartData =
    stats?.growthChart.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      users: item.users,
    })) || [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of user statistics and system metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <div className="text-2xl font-bold">
                    {stat.value.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Growth Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total users over the last 30 days
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No user data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
