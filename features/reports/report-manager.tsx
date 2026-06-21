"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Code2, Copy, Download, Eye, Image, Loader2, QrCode, RefreshCw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { ReportDTO } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";

export function ReportManager() {
  const initial = useSearchParams().get("q") || "";
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<ReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ReportDTO | null>(null);
  const [previewMode, setPreviewMode] = useState<"verified" | "original" | "qr">("verified");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/reports?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    setItems(data.items || []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  async function remove(report: ReportDTO) {
    if (!confirm(`Permanently delete ${report.uid} and all generated assets?`)) return;
    const response = await fetch(`/api/reports/${report._id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error);
    toast.success("Report and QR assets deleted");
    load();
  }

  async function regenerate(report: ReportDTO) {
    const response = await fetch("/api/reports/regenerate-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: report._id })
    });
    if (!response.ok) return toast.error("Could not regenerate and embed the QR code");
    toast.success("QR regenerated and PDF updated using current settings");
    load();
  }

  function copyLink(report: ReportDTO) {
    navigator.clipboard.writeText(report.reportUrl);
    toast.success("Public report link copied");
  }

  function openPreview(report: ReportDTO, mode: typeof previewMode) {
    setPreview(report);
    setPreviewMode(mode);
  }

  return (
    <>
      <div className="relative mb-5 max-w-xl"><Search className="absolute left-3.5 top-3 text-slate-400" size={18} /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search UID, patient, mobile or report name" className="pl-10" /></div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Report</th><th className="px-5 py-4">Patient</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Engagement</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
            <tbody>
              {items.map((report) => <tr key={report._id} className="table-row border-t"><td className="px-5 py-4"><p className="font-semibold">{report.reportName}</p><p className="text-xs text-slate-400">{report.uid} · {formatBytes(report.fileSize)}</p></td><td className="px-5 py-4"><p>{report.patientName || report.patient?.fullName}</p><p className="text-xs text-slate-400">{report.mobileNumber || report.patient?.mobile}</p></td><td className="px-5 py-4">{report.reportType}</td><td className="px-5 py-4 text-xs text-slate-500">{report.views} views · {report.downloads} downloads</td><td className="px-5 py-4"><Badge tone={report.status === "active" ? "green" : report.status === "revoked" ? "red" : "gray"}>{report.status}</Badge></td><td className="px-5 py-4"><div className="flex min-w-[280px] flex-wrap justify-end gap-1"><Button title="View embedded PDF" variant="ghost" size="sm" onClick={() => openPreview(report, "verified")}><Eye size={16} /></Button><a href={`/api/reports/${report._id}/file?download=1`}><Button title="Download embedded PDF" variant="ghost" size="sm"><Download size={16} /></Button></a><Button title="Copy public link" variant="ghost" size="sm" onClick={() => copyLink(report)}><Copy size={16} /></Button><Button title="Preview QR" variant="ghost" size="sm" onClick={() => openPreview(report, "qr")}><QrCode size={16} /></Button><a href={`/api/reports/${report._id}/qr?format=png`}><Button title="Download QR PNG" variant="ghost" size="sm"><Image size={16} /></Button></a><a href={`/api/reports/${report._id}/qr?format=svg`}><Button title="Download QR SVG" variant="ghost" size="sm"><Code2 size={16} /></Button></a><Button title="Regenerate QR and PDF" variant="ghost" size="sm" onClick={() => regenerate(report)}><RefreshCw size={16} /></Button><Button title="Delete" variant="ghost" size="sm" className="text-red-600" onClick={() => remove(report)}><Trash2 size={16} /></Button></div></td></tr>)}
              {loading && <tr><td colSpan={6} className="py-16"><Loader2 className="mx-auto animate-spin text-gold" /></td></tr>}
              {!loading && !items.length && <tr><td colSpan={6} className="py-16 text-center text-slate-400">No reports found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {preview && <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950/80 p-4 backdrop-blur-sm"><div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-3 rounded-t-xl bg-white px-5 py-3 sm:flex-row sm:items-center"><div><p className="font-semibold">{preview.reportName}</p><p className="text-xs text-slate-400">{preview.uid} · QR {preview.qrPosition}, {preview.qrSize}pt</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg bg-slate-100 p-1"><button onClick={() => setPreviewMode("original")} className={`rounded-md px-3 py-1.5 text-xs ${previewMode === "original" ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}>Original</button><button onClick={() => setPreviewMode("verified")} className={`rounded-md px-3 py-1.5 text-xs ${previewMode === "verified" ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}>With QR</button><button onClick={() => setPreviewMode("qr")} className={`rounded-md px-3 py-1.5 text-xs ${previewMode === "qr" ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}>QR</button></div><Button variant="ghost" size="sm" onClick={() => setPreview(null)}><X size={17} /></Button></div></div>{previewMode === "qr" ? <div className="mx-auto grid h-full w-full max-w-6xl place-items-center rounded-b-xl bg-white"><div className="text-center"><img src={preview.qrImageUrl} alt={`${preview.uid} QR`} className="mx-auto size-72 rounded-2xl border p-3" /><p className="mt-4 max-w-lg break-all text-sm text-slate-500">{preview.reportUrl}</p></div></div> : <iframe title={preview.reportName} src={`/api/reports/${preview._id}/file${previewMode === "original" ? "?variant=original" : ""}`} className="mx-auto h-full w-full max-w-6xl rounded-b-xl bg-white" />}</div>}
    </>
  );
}
