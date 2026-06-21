"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { QRPosition } from "@/types";

type Settings = {
  labName: string;
  logoUrl?: string;
  address: string;
  contactNumber: string;
  email: string;
  reportUrlPrefix: string;
  theme: "light" | "system";
  qrPosition: QRPosition;
  qrSize: number;
  qrMargin: number;
  qrCustomX: number;
  qrCustomY: number;
};

const qrLabels: Record<QRPosition, string> = {
  "cns-psychiatry": "CNS / Psychiatry box",
  "bottom-right": "Bottom right",
  "bottom-left": "Bottom left",
  "top-right": "Top right",
  "top-left": "Top left",
  custom: "Custom X / Y"
};

export function SettingsForm() {
  const [data, setData] = useState<Settings | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((response) => response.json()).then((item) => setData({
      ...item,
      qrPosition: item.qrPosition || "cns-psychiatry",
      qrSize: item.qrSize || 68,
      qrMargin: item.qrMargin ?? 24,
      qrCustomX: item.qrCustomX ?? 24,
      qrCustomY: item.qrCustomY ?? 24
    }));
  }, []);

  if (!data) return <Loader2 className="mx-auto mt-20 animate-spin text-gold" />;
  const text = (key: keyof Settings, value: string) => setData({ ...data, [key]: value });
  const number = (key: keyof Settings, value: string) => setData({ ...data, [key]: Number(value) });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!data) return;
    setSaving(true);
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "logoUrl") form.set(key, String(value));
    });
    if (logo) form.set("logo", logo);
    const response = await fetch("/api/settings", { method: "PUT", body: form });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(result.error || "Unable to save settings");
    setData(result);
    setLogo(null);
    toast.success("Report and QR settings saved");
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Lab profile" description="Shown on every public verification page" />
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <Field label="Lab name"><Input value={data.labName} onChange={(e) => text("labName", e.target.value)} required /></Field>
            <Field label="Contact number"><Input value={data.contactNumber} onChange={(e) => text("contactNumber", e.target.value)} /></Field>
            <Field label="Email address"><Input type="email" value={data.email} onChange={(e) => text("email", e.target.value)} required /></Field>
            <Field label="Theme"><Select value={data.theme} onChange={(e) => text("theme", e.target.value)}><option value="light">Light</option><option value="system">Follow system</option></Select></Field>
            <div className="sm:col-span-2"><Field label="Address"><Textarea value={data.address} onChange={(e) => text("address", e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label="Report URL prefix"><Input type="url" value={data.reportUrlPrefix} onChange={(e) => text("reportUrlPrefix", e.target.value)} required /><p className="mt-1.5 text-xs text-slate-400">Use a prefix such as https://lab.example.com/report?id= or include {"{uid}"} as a placeholder.</p></Field></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="QR placement" description="Applied when reports are uploaded or QR codes are regenerated" />
          <div className="grid gap-5 p-6 sm:grid-cols-3">
            <Field label="Position"><Select value={data.qrPosition} onChange={(e) => text("qrPosition", e.target.value)}>{Object.entries(qrLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
            <Field label="Size"><Input type="number" min={48} max={240} value={data.qrSize} onChange={(e) => number("qrSize", e.target.value)} /><p className="mt-1 text-xs text-slate-400">PDF points, default 100</p></Field>
            <Field label="Page margin"><Input type="number" min={0} max={144} value={data.qrMargin} onChange={(e) => number("qrMargin", e.target.value)} /></Field>
            {data.qrPosition === "custom" && <><Field label="Custom X"><Input type="number" min={0} value={data.qrCustomX} onChange={(e) => number("qrCustomX", e.target.value)} /></Field><Field label="Custom Y"><Input type="number" min={0} value={data.qrCustomY} onChange={(e) => number("qrCustomY", e.target.value)} /></Field></>}
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader title="Lab logo" description="PNG or JPEG works best" />
          <div className="p-6">
            <div className="mb-4 grid h-32 place-items-center rounded-xl border bg-slate-50">{data.logoUrl ? <img src={data.logoUrl} alt="Lab logo" className="max-h-24 max-w-[80%]" /> : <span className="font-display text-xl text-slate-300">YOUR LAB</span>}</div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium hover:border-gold"><Upload size={17} />Choose logo<input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] || null)} /></label>
            {logo && <p className="mt-2 truncate text-xs text-slate-500">Selected: {logo.name}</p>}
          </div>
        </Card>
        <Button size="lg" className="w-full" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />}Save Settings</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>{children}</label>;
}
