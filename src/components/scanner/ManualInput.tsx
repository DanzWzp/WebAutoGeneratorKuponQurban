"use client";

import { useState } from "react";
import { Keyboard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => void;
}

export function ManualInput({ open, onOpenChange, onSubmit }: Props) {
  const [code, setCode] = useState("");

  function submit() {
    const v = code.trim().toUpperCase();
    if (!v) return;
    onSubmit(v);
    setCode("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Input Kode Manual
          </DialogTitle>
          <DialogDescription>
            Ketik kode kupon (di bawah barcode) jika kamera tidak bisa membaca.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="manual-code">Kode Kupon</Label>
          <Input
            id="manual-code"
            value={code}
            autoFocus
            autoCapitalize="characters"
            placeholder="cth. K7XQ9M2A"
            className="font-mono text-lg uppercase tracking-widest"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button onClick={submit} disabled={!code.trim()}>
            Verifikasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
