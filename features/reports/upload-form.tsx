"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Download, FileText, Loader2, QrCode, ScanText, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReportDTO } from "@/types";

type Result = {
  uid: string;
  reportUrl: string;
  qrImage: string;
  originalPdf: string;
  modifiedPdf: string;
  report: ReportDTO;
};

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [reportUid, setReportUid] = useState("");
  const [extractingUid, setExtractingUid] = useState(false);
  const [uidMessage, setUidMessage] = useState("");
  const [patientName, setPatientName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("Pathology");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [processedPreview, setProcessedPreview] = useState(true);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function selectPDF(selected: File | null) {
    setFile(selected);
    setReportUid("");
    setUidMessage("");
    if (!selected) return;
    setExtractingUid(true);
    const form = new FormData();
    form.set("file", selected);
    try {
      const response = await fetch("/api/reports/extract-uid", { method: "POST", body: form });
      const data = await response.json();
      if (response.ok && data.uid) {
        setReportUid(data.uid);
        setUidMessage("UID detected automatically. Please verify it against the PDF.");
        toast.success(`Detected report UID: ${data.uid}`);
      } else {
        setUidMessage(data.error || "UID was not detected; enter it manually.");
      }
    } catch {
      setUidMessage("UID detection was unavailable; enter it manually.");
    } finally {
      setExtractingUid(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || reportUid.trim().length < 6 || !patientName.trim() || mobileNumber.trim().length < 8 || !reportType) {
      return toast.error("Complete all patient and report fields");
    }
    const form = new FormData();
    form.set("file", file);
    form.set("reportUid", reportUid);
    form.set("patientName", patientName);
    form.set("mobileNumber", mobileNumber);
    form.set("reportName", reportName || `${reportType} Report`);
    form.set("reportType", reportType);
    setLoading(true);
    const response = await fetch("/api/reports/upload", { method: "POST", body: form });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return toast.error(data.error || "Upload failed");
    setResult(data);
    setProcessedPreview(true);
    toast.success("QR embedded PDF generated successfully");
  }

  if (result) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-navy-glow p-7 text-center text-white">
            <CheckCircle2 className="mx-auto text-gold" size={48} />
            <h2 className="mt-3 font-display text-3xl font-semibold">Verified report generated</h2>
            <p className="mt-1 text-sm text-slate-300">The original is preserved and the QR is embedded in a separate PDF.</p>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_190px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Report UID</p>
              <p className="mt-1 font-display text-2xl font-semibold">{result.uid}</p>
              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">Public verification URL</p>
              <div className="mt-2 flex gap-2"><Input readOnly value={result.reportUrl} /><Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(result.reportUrl); toast.success("Link copied"); }}><Copy size={16} /></Button></div>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={result.reportUrl} target="_blank" rel="noreferrer"><Button>Open Public Page</Button></a>
                <a href={`/api/reports/${result.report._id}/file?download=1`}><Button variant="outline"><Download size={16} />Verified PDF</Button></a>
                <Link href="/reports"><Button variant="ghost">All Reports</Button></Link>
                <Button variant="ghost" type="button" onClick={() => { setResult(null); setFile(null); setReportUid(""); setUidMessage(""); setPatientName(""); setMobileNumber(""); setReportName(""); }}>Upload Another</Button>
              </div>
            </div>
            <div className="rounded-2xl border p-3 text-center"><img src={result.qrImage} alt={`QR for ${result.uid}`} className="w-full" /><div className="mt-2 flex justify-center gap-3 text-xs font-semibold text-gold"><a href={`/api/reports/${result.report._id}/qr?format=png`}>PNG</a><a href={`/api/reports/${result.report._id}/qr?format=svg`}>SVG</a></div></div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center"><div><h3 className="font-display text-xl font-semibold">Visual placement confirmation</h3><p className="text-xs text-slate-500">Compare the untouched source with the generated report.</p></div><div className="flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setProcessedPreview(false)} className={`rounded-lg px-4 py-2 text-sm ${!processedPreview ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}>Original</button><button type="button" onClick={() => setProcessedPreview(true)} className={`rounded-lg px-4 py-2 text-sm ${processedPreview ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}>With QR</button></div></div>
          <iframe title={processedPreview ? "QR embedded PDF" : "Original PDF"} src={processedPreview ? result.modifiedPdf : result.originalPdf} className="h-[72vh] min-h-[620px] w-full bg-slate-100" />
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold">Patient & report details</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">A patient profile is matched or created by mobile number.</p>
          <div className="space-y-5">
            <Field label="UID printed on PDF"><div className="relative"><Input value={reportUid} onChange={(e) => setReportUid(e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder={extractingUid ? "Scanning PDF for UID..." : "e.g. 102000576A3337241"} className="pr-11" minLength={6} maxLength={40} required />{extractingUid ? <Loader2 className="absolute right-3.5 top-3 animate-spin text-gold" size={18} /> : <ScanText className="absolute right-3.5 top-3 text-slate-400" size={18} />}</div><p className={`mt-1.5 text-xs ${reportUid ? "text-emerald-600" : "text-slate-400"}`}>{uidMessage || "Select a PDF and its printed UID will be detected automatically."}</p></Field>
            <Field label="Patient name"><Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Full patient name" required /></Field>
            <Field label="Mobile number"><Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9+]/g, ""))} placeholder="10-digit mobile number" minLength={8} required /></Field>
            <Field label="Report type"><Select value={reportType} onChange={(e) => setReportType(e.target.value)}><option>Pathology</option><option>Haematology</option><option>Biochemistry</option><option>Radiology</option><option>Histopathology</option><option>Other</option></Select></Field>
            <Field label="Report name (optional)"><Input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder={`${reportType} Report`} /></Field>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b p-6"><h2 className="font-display text-xl font-semibold">Original PDF preview</h2><p className="mt-1 text-sm text-slate-500">Confirm the source document before generating the embedded version.</p></div>
          {previewUrl ? <><iframe title="Original PDF preview" src={previewUrl} className="h-[520px] w-full bg-slate-100" /><label className="flex cursor-pointer items-center justify-center gap-2 border-t p-4 text-sm font-semibold text-gold"><FileText size={17} />Replace PDF<input type="file" accept="application/pdf" className="hidden" onChange={(e) => selectPDF(e.target.files?.[0] || null)} /></label></> : <label className="flex min-h-[520px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition hover:border-gold"><input type="file" accept="application/pdf" className="hidden" onChange={(e) => selectPDF(e.target.files?.[0] || null)} /><UploadCloud size={46} className="text-gold" /><p className="mt-3 font-semibold">Drop a PDF here or browse</p><p className="mt-1 text-xs text-slate-400">PDF only · maximum {process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 10} MB</p></label>}
        </Card>
      </div>
      <div className="flex justify-end"><Button size="lg" disabled={loading || !file}>{loading ? <Loader2 className="animate-spin" /> : <QrCode />}{loading ? "Embedding QR into PDF..." : "Generate Verified Report"}</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium">{label} *</span>{children}</label>;
}
