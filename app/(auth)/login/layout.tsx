import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
}
