import { Ticket, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatistikPenerima } from "@/types";

export function StatsCards({ stats }: { stats: StatistikPenerima }) {
  const items = [
    {
      label: "Total Kupon",
      value: stats.total,
      icon: Ticket,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Sudah Diambil",
      value: stats.redeemed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Belum Diambil",
      value: stats.available,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Progress",
      value: `${stats.progress}%`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
              >
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {/* Progress bar */}
      <div className="col-span-2 lg:col-span-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
