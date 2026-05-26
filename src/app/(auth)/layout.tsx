import { Beef } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Beef className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Generator Kupon Kurban
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Buat, cetak, dan verifikasi kupon pengambilan daging kurban dengan
          barcode unik.
        </p>
      </div>
      {children}
    </div>
  );
}
