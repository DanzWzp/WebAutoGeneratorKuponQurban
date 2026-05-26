import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StatusKupon } from "@/types";

export function StatusBadge({ status }: { status: StatusKupon }) {
  if (status === "REDEEMED") {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Sudah Diambil
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      Belum Diambil
    </Badge>
  );
}
