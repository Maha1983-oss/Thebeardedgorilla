"use client";

import dynamic from "next/dynamic";

const PLDashboard = dynamic(() => import("@/components/client2"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  ),
});

export default function Client2Page() {
  return <PLDashboard />;
}
