import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, FileCheck2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { connectDB } from "@/lib/db";
import Report from "@/models/Report";
import Settings from "@/models/Settings";
import { PublicReportActions } from "@/components/providers/public-report-actions";
import { isValidReportUID, normalizeReportUID } from "@/lib/report-uid";

export async function PublicReportView({ uid }: { uid: string }) {
  uid = normalizeReportUID(uid);
  if (!isValidReportUID(uid)) notFound();
  await connectDB();
  const [report, settings] = await Promise.all([
    Report.findOneAndUpdate(
      { uid, status: "active" },
      { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } },
      { new: true }
    ).lean(),
    Settings.findOne({ key: "system" }).lean()
  ]);
  if (!report) notFound();
  const lab = settings || {
    labName: "MedVault Diagnostics",
    logoUrl: undefined,
    address: "",
    contactNumber: "",
    email: ""
  };
  const fileUrl = `/api/report/public?id=${encodeURIComponent(uid)}&file=1`;

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            {lab.logoUrl ? <img src={lab.logoUrl} alt={lab.labName} className="h-11 max-w-44 object-contain" /> : <><div className="grid size-11 place-items-center rounded-xl bg-ink text-gold"><ShieldCheck /></div><div><p className="font-display text-lg font-semibold tracking-wide">{lab.labName}</p><p className="text-[10px] uppercase tracking-[.2em] text-slate-400">Medical Report Portal</p></div></>}
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-emerald-700 sm:flex"><span className="size-2 rounded-full bg-emerald-500" />Secure connection</div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <div className="overflow-hidden rounded-3xl border bg-white shadow-[0_24px_80px_rgba(15,23,42,.08)]">
          <div className="bg-navy-glow px-6 py-8 text-center text-white">
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold"><FileCheck2 size={27} /></div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"><CheckCircle2 size={14} />Verified Medical Report</div>
            <h1 className="mt-3 font-display text-3xl font-semibold">{report.reportName}</h1>
            <p className="mt-1 font-mono text-sm text-slate-300">{report.uid}</p>
          </div>
          <div className="p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <Info icon={UserRound} label="Patient" value={report.patientName} />
              <Info icon={CalendarDays} label="Upload date" value={new Date(report.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />
              <Info icon={FileCheck2} label="Report type" value={report.reportType} />
            </div>
            <div className="my-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              {report.qrImageUrl ? (
                <div className="flex items-center gap-3"><img src={report.qrImageUrl} alt="Verification QR" className="size-20 rounded-lg border p-1" /><div><p className="font-semibold">Authenticity verified</p><p className="text-xs text-slate-500">The QR inside this PDF resolves to this verification page.</p></div></div>
              ) : (
                <div><p className="font-semibold">Verified medical report</p><p className="text-xs text-slate-500">This report has been verified by the issuing centre.</p></div>
              )}
              <PublicReportActions uid={uid} />
            </div>
            <div className="overflow-hidden rounded-2xl border bg-slate-100">
              <iframe title={`${report.uid} verified PDF`} src={fileUrl} className="h-[72vh] min-h-[560px] w-full bg-white" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-center gap-2 text-center text-xs text-slate-400"><LockKeyhole size={14} />Share this medical document only with authorized recipients.</div>
      </section>
      <footer className="border-t bg-white py-6 text-center text-xs text-slate-400">{lab.labName}{lab.contactNumber ? ` · ${lab.contactNumber}` : ""}{lab.email ? ` · ${lab.email}` : ""}</footer>
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><Icon size={18} className="text-gold" /><p className="mt-2 text-xs uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold capitalize">{value}</p></div>;
}
