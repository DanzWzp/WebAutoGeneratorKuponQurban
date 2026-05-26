"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function BulkInputDialog({ open, onOpenChange, onSaved }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const validCount = useMemo(
    () => text.split("\n").map((s) => s.trim()).filter(Boolean).length,
    [text]
  );

  async function handleSubmit() {
    if (validCount === 0) {
      toast.error("Masukkan minimal satu nama");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/penerima/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambah");
      }
      toast.success(`${data.count} penerima ditambahkan`, {
        description: "Kode kupon unik dibuat otomatis untuk setiap penerima.",
      });
      setText("");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error("Gagal menambah penerima", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tambah Banyak Penerima
          </DialogTitle>
          <DialogDescription>
            Tempel daftar nama, <strong>satu nama per baris</strong>. Kode kupon
            unik dibuat otomatis untuk setiap nama.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bulk-names">Daftar Nama</Label>
          <Textarea
            id="bulk-names"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Ahmad Sudrajat\nBudi Santoso\nCitra Lestari\n..."}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            {validCount} nama terdeteksi
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading || validCount === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tambah {validCount > 0 ? `${validCount} Nama` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
