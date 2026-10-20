import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/admin/analytics";
import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Service Analytics",
};

export default async function AdminAnalyticsPage() {
  await requireRole("admin");
  const data = await getAnalyticsData({ dateRange: "30d", service: "all" });
  return <AnalyticsClient initialData={data} />;
}
