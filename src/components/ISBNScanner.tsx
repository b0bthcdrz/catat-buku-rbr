import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, NotFoundException } from "@zxing/library";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ISBNScannerProps = {
  onISBNDetected: (isbn: string) => void;
  onCancel?: () => void;
  isActive: boolean;
  className?: string;
};

// Normalize decoded text to ISBN-10/13
function normalizeToISBN(text: string): string | null {
  const cleaned = text.replace(/[^0-9Xx]/g, "");
  // ISBN-13 (EAN-13 with 978/979 prefix)
  if (/^(978|979)\d{10}$/.test(cleaned)) return cleaned;
  // ISBN-10
  if (/^\d{9}[\dXx]$/.test(cleaned)) return cleaned.toUpperCase();
  return null;
}

export default function ISBNScanner({ onISBNDetected, onCancel, isActive, className }: ISBNScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function start() {
      setStatus("Starting camera...");
      try {
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserMultiFormatReader();
        }

        const formats = [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ];

        const reader = codeReaderRef.current;
        await reader.listVideoInputDevices(); // ensure permissions prompt

        reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (!isMounted) return;
            if (result) {
              const text = result.getText();
              const isbn = normalizeToISBN(text);
              if (isbn) {
                setLastDetected(isbn);
                setStatus("Detected");
                stopScan();
                onISBNDetected(isbn);
              }
              return;
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error(err);
              setStatus("Scanner error");
            } else {
              setStatus("Scanning...");
            }
          },
          { delayBetweenScanAttempts: 150, delayBetweenScanSuccess: 800, hints: { possibleFormats: formats } }
        );
      } catch (e: any) {
        console.error(e);
        setStatus("Camera error");
        toast({ title: "Camera error", description: e?.message ?? String(e), variant: "destructive" });
      }
    }

    if (isActive) {
      start();
    } else {
      stopScan();
    }

    return () => {
      isMounted = false;
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  function stopScan() {
    try {
      codeReaderRef.current?.reset();
    } catch (e) {
      console.error(e);
    }
    setStatus("Idle");
  }

  return (
    <Card className={cn("shadow-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Scan ISBN
        </CardTitle>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close scanner</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative w-full aspect-[4/3] bg-black rounded overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm">
              Camera inactive
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <p><span className="font-medium">Status:</span> {status}</p>
          {lastDetected && <p><span className="font-medium">Last:</span> {lastDetected}</p>}
          <p>Hold steady; fill most of the frame with the barcode.</p>
        </div>
      </CardContent>
    </Card>
  );
}