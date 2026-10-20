import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getAnalyticsData, type AnalyticsFilters } from "@/lib/admin/analytics";

export async function GET(req: Request) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(req.url);
    const dateRange = (searchParams.get("dateRange") || "30d") as AnalyticsFilters["dateRange"];
    const service = (searchParams.get("service") || "all") as AnalyticsFilters["service"];
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const data = await getAnalyticsData({ dateRange, service, startDate, endDate });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/admin/analytics] error:", error);
    return NextResponse.json({ error: "Unauthorized or failed" }, { status: 401 });
  }
}
