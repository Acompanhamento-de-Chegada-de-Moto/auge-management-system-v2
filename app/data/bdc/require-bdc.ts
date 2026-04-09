import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const requireBdc = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/bdc/login");
  }

  if (session.user.role !== "BDC") {
    return redirect("/not-bdc");
  }

  return session;
});
