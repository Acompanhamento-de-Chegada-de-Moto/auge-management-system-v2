import { NextRequest, NextResponse } from "next/server";
import { publicGetClientStatus } from "@/app/data/bdc/bdc-get-client-rows";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const results = await publicGetClientStatus(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
