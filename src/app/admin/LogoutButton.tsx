"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors w-full"
    >
      <LogOut className="w-5 h-5" /> Déconnexion
    </button>
  );
}
