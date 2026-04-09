import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const requireLogistics = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/logistics/login");
  }

  if (session.user.role !== "LOGISTICS") {
    return redirect("/not-logistics");
  }

  return session;
});
