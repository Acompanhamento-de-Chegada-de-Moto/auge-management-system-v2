"use client";

import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";

export function LogoutButton() {
  async function handleLogout() {
    await authClient.signOut();
    redirect("/");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="cursor-pointer"
      onClick={handleLogout}
    >
      <LogOut className="size-4 mr-2" />
      Sair
    </Button>
  );
}
