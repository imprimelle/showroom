"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  const logout = async () => {
    try {
      await fetch("/api/member/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <button
      onClick={logout}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-error)]"
    >
      <LogOut className="w-4 h-4" /> Se déconnecter
    </button>
  );
}
