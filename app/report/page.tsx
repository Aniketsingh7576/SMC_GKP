import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicReportView } from "@/features/reports/public-report-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify Medical Report",
  description: "Secure medical report verification and PDF access."
};

export default async function ReportPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const uid = (await searchParams).id;
  if (!uid) notFound();
  return <PublicReportView uid={uid} />;
}
