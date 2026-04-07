import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const authHandlers = toNextJsHandler(auth.handler);

export const { GET, POST } = authHandlers;
