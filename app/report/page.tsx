import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Open the verified PDF directly (inline, full page) — no verification UI.
export default async function ReportPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const uid = (await searchParams).id;
  if (!uid) notFound();
  redirect(`/api/report/public?id=${encodeURIComponent(uid)}&file=1`);
}
