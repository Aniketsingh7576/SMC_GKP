import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MotionReveal } from "@/components/ui/motion-reveal";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <MotionReveal>
      <Card className="group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-gold/20 bg-amber-50/60 text-amber-600 transition group-hover:bg-gold group-hover:text-white">
            <Icon size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{value}</p>
            <p className="mt-2 text-xs font-medium text-emerald-600">{hint}</p>
          </div>
        </div>
      </Card>
    </MotionReveal>
  );
}
