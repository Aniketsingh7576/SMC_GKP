"use client";

import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicReportActions({ uid }: { uid: string }) {
  const fileUrl = `/api/report/public?id=${encodeURIComponent(uid)}&file=1`;
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a href={fileUrl} target="_blank" rel="noreferrer">
        <Button size="lg" className="w-full"><ExternalLink size={18} />View Report</Button>
      </a>
      <a href={`${fileUrl}&download=1`}>
        <Button size="lg" variant="outline" className="w-full"><Download size={18} />Download Report</Button>
      </a>
    </div>
  );
}
