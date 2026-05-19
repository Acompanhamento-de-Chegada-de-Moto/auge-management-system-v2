import { type NextRequest, NextResponse } from "next/server";
import { publicGetClientStatus } from "@/app/data/bdc/bdc-get-client-rows";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (query.length < 3 || query.length > 100) {
    return NextResponse.json([]);
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : (req.headers.get("x-real-ip") ?? "unknown");
  const limit = rateLimit({
    identifier: `public-search:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 },
    );
  }

  try {
    const results = await publicGetClientStatus(query);
    return NextResponse.json(results);
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
