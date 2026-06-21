import { redirect } from "next/navigation";

export default async function LegacyReportPage({
  params
}: {
  params: Promise<{ uid: string }>;
}) {
  redirect(`/report?id=${encodeURIComponent((await params).uid)}`);
}
