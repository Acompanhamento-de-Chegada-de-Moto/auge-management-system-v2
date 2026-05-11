import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "BDC" | "LOGISTICS";
};

export const requireBdc = cache(async (): Promise<CurrentUser> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/bdc/login");
  }

  if (session.user.role !== "BDC") {
    redirect("/not-bdc");
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
});
